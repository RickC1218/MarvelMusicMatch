export const buttonBaseClasses = `
  flex
  items-center
  justify-center
  gap-md
  rounded-lg
  font-semibold
`;

export const paddingWithLabel = 'px-lg py-sm';
export const paddingWithoutLabel = 'p-sm';

const buttonVariants = {
  primary: 'bg-primary text-neutral shadow-md hover:shadow-lg',
  background: 'bg-background text-primary flex-row-reverse shadow hover:shadow-md',
  success: 'bg-success text-primary shadow-sm hover:shadow-md',
  danger: 'bg-danger text-neutral shadow-md hover:shadow-lg',
};

export const buttonTypeClasses = {
  primary: buttonVariants.primary,
  background: buttonVariants.background,
  success: buttonVariants.success,
  danger: buttonVariants.danger,
};