type Props = {
  imageUrl?: string;
  shopName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizes = {
  sm: 'h-9 w-9 text-sm',
  md: 'h-11 w-11 text-lg',
  lg: 'h-20 w-20 text-2xl',
};

export function RoundLogo({ imageUrl, shopName, size = 'md', className = '' }: Props) {
  const dim = sizes[size];
  if (imageUrl?.trim()) {
    return (
      <img
        src={imageUrl}
        alt={shopName}
        className={`rounded-full object-cover ring-2 ring-indigo-100 ${dim} ${className}`}
      />
    );
  }
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-indigo-600 font-bold text-white ${dim} ${className}`}
    >
      {shopName.charAt(0).toUpperCase()}
    </span>
  );
}
