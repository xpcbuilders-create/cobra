import { nameInitials } from '../utils/initials';

type Props = {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizes = {
  sm: 'h-9 w-9 text-sm',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

export function UserAvatar({ name, size = 'md', className = '' }: Props) {
  return (
    <span
      title={name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-indigo-600 font-bold text-white ring-2 ring-white ${sizes[size]} ${className}`}
    >
      {nameInitials(name)}
    </span>
  );
}
