import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userID, code, orgID } = req.query;

  // Validate required parameters
  if (!userID || !code || !orgID) {
    return res.status(400).json({ 
      error: 'Missing required parameters: userID, code, or orgID' 
    });
  }

  const token = process.env.SERVICE_ACCOUNT_ACCESS_TOKEN;
  
  try {
    // Step 1: Verify the invitation code
    const verifyResponse = await fetch(`${process.env.ZITADEL_API}/v2/users/${userID}/invite_code/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        verificationCode: code
      }),
    });

    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text();
      console.error(`Error verifying invitation code (${verifyResponse.status}):`, errorText);
      
      // Check if it's a "Code is invalid" error, which often means already used
      // In that case, we continue with the flow (user might have clicked twice)
      if (verifyResponse.status === 400 && errorText.includes('Code is invalid')) {
        console.log('Code already used or invalid, continuing with login flow...');
        // Continue to get user details and redirect - don't return error
      } else {
        return res.status(verifyResponse.status).json({ 
          error: 'Invalid or expired invitation code' 
        });
      }
    } else {
      console.log('Invitation code verified successfully');
    }

    // Step 2: Get user details to obtain the username for login_hint
    const userResponse = await fetch(`${process.env.ZITADEL_API}/v2/users/${userID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error(`Error fetching user details (${userResponse.status}):`, errorText);
      return res.status(userResponse.status).json({ 
        error: 'Failed to retrieve user details' 
      });
    }

    const userData = await userResponse.json();
    const username = userData.user?.username || userData.user?.preferredLoginName;

    if (!username) {
      console.error('Username not found in user data:', userData);
      return res.status(400).json({ 
        error: 'Username not found for user' 
      });
    }

    console.log('User details retrieved, username:', username);

    // Step 3: Redirect to ZITADEL console with login_hint
    const consoleUrl = `${process.env.PUBLIC_NEXT_ZITADEL_API}/ui/console/users/me?login_hint=${encodeURIComponent(username)}`;
    
    console.log('Redirecting to ZITADEL console:', consoleUrl);

    // Redirect to ZITADEL console with login_hint
    return res.redirect(302, consoleUrl);

  } catch (error) {
    console.error('Error processing invitation:', error);
    return res.status(500).json({ 
      error: 'Internal server error while processing invitation' 
    });
  }
}
