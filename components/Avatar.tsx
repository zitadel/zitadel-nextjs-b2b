import { FC } from 'react';

import classNames from 'classnames';
import { Color, getColorHash } from '../lib/color';

export enum AvatarSize {
  COMPACT = 'compact',
  SMALL = 'small',
  BASE = 'base',
  LARGE = 'large',
}
interface AvatarProps {
  name: string | null | undefined;
  loginName: string;
  imageUrl?: string;
  size?: AvatarSize;
  shadow?: boolean;
  classes?: string;
}

export const Avatar: FC<AvatarProps> = ({ size = AvatarSize.BASE, name, loginName, imageUrl, shadow, classes }) => {
  let credentials = '';

  if (name) {
    const split = name.split(' ');
    const initials = split[0].charAt(0) + (split[1] ? split[1].charAt(0) : '');
    credentials = initials;
  } else if (loginName) {
    const username = loginName.split('@')[0];
    let separator = '_';
    if (username.includes('-')) {
      separator = '-';
    }
    if (username.includes('.')) {
      separator = '.';
    }
    const split = username.split(separator);
    const initials = split[0].charAt(0) + (split[1] ? split[1].charAt(0) : '');
    credentials = initials;
  } else {
    credentials = 'A';
  }

  const color: Color = getColorHash(loginName ?? name ?? 'A');

  const avatarStyleDark = {
    backgroundColor: color[900],
    color: color[200],
  };

  return (
    <div
      className={classNames(
        `flex-shrink-0 flex justify-center items-center cursor-default pointer-events-none group-focus:outline-none group-focus:ring-2 transition-colors duration-200 dark:group-focus:ring-offset-blue bg-primary-light-500 hover:bg-primary-light-400 hover:dark:bg-primary-dark-500 group-focus:ring-primary-light-200 dark:group-focus:ring-primary-dark-400 dark:bg-primary-dark-300 text-white dark:text-blue rounded-full ${
          shadow ? 'shadow' : ''
        } ${
          size === AvatarSize.LARGE
            ? 'h-20 w-20 font-normal'
            : size === AvatarSize.BASE
            ? 'w-[38px] h-[38px] font-bold'
            : size === AvatarSize.SMALL
            ? 'w-32px h-32px font-bold'
            : size === AvatarSize.COMPACT
            ? 'w-8 h-8 font-bold'
            : ''
        }`,
        classes,
      )}
      style={avatarStyleDark}
    >
      {imageUrl ? (
        <img className="border border-gray-500 rounded-full w-12 h-12" src={imageUrl} />
      ) : (
        <span className={`uppercase ${size === AvatarSize.LARGE ? 'text-xl' : 'text-[13px]'}`}>{credentials}</span>
      )}
    </div>
  );
};
