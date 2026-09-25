export const buttonBaseClasses =
  'inline-flex items-center justify-center gap-s rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2';

export const paddingWithLabel = 'px-lg py-sm';
export const paddingWithoutLabel = 'p-sm';

export type ButtonVariant = 'primary' | 'background' | 'accent' | 'success' | 'danger' | 'outline';

export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-neutral shadow-md hover:opacity-90 hover:shadow-lg',
  background: 'bg-background text-primary shadow hover:shadow-md',
  accent: 'bg-accent text-white shadow-md hover:opacity-90 hover:shadow-lg',
  success: 'bg-success text-onSuccess shadow-sm hover:opacity-90 hover:shadow-md',
  danger: 'bg-danger text-neutral shadow-md hover:opacity-90 hover:shadow-lg',
  outline: 'border border-primary bg-transparent text-primary hover:bg-neutral',
};
