import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const session = await getServerSession(req, res, authOptions);
  if (!session?.accessToken) return res.status(401).end();

  const { username, givenName, familyName, email, orgId } = req.body;
  
  if (!username || !givenName || !familyName || !email || !orgId) {
    return res.status(400).json({ 
      error: 'Missing required fields: username, givenName, familyName, email, or orgId' 
    });
  }

  // Form the display name by joining given and family names
  const displayName = `${givenName} ${familyName}`;

  const token = process.env.SERVICE_ACCOUNT_ACCESS_TOKEN;
  const url = `${process.env.ZITADEL_API}/v2/users/human`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        username,
        organization: {
          orgId: orgId,
        },
        profile: {
          givenName,
          familyName,
          displayName,
        },
        email: {
          email,
          returnCode: {},
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error creating user (${response.status}):`, errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const userData = await response.json();
    
    // After user creation, trigger the invitation email
    const userId = userData.userId;
    if (userId) {
      try {
        const inviteResponse = await fetch(`${process.env.ZITADEL_API}/v2/users/${userId}/invite_code`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            sendCode: {
              applicationName: "Portal Web"
            }
          }),
        });

        if (inviteResponse.ok) {
          userData.invitationSent = true;
        } else {
          console.warn('Failed to send invitation email, but user was created');
          userData.invitationSent = false;
        }
      } catch (inviteError) {
        console.warn('Error sending invitation email:', inviteError);
        userData.invitationSent = false;
      }
    }
    
    res.status(200).json(userData);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
}
