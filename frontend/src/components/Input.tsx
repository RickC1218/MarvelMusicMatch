import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { Button } from "./Button";

interface InputProps {
  placeholder?: string;
  onClick?: () => void;
  type?: 'primary' | 'background' | 'success' | 'danger';
  icon?: IconProp | null;
  iconColor?: string;
}

export const Input: React.FC<InputProps> = ({ placeholder, onClick, type, icon, iconColor }) => {
  return (
    <div className="flex items-stretch w-full">
      <Button type={type} icon={icon} iconColor={iconColor} onClick={onClick} className="w-[94px] rounded-l-xl rounded-r-none px-lg" />
      <input
        type="text"
        placeholder={placeholder}
        onClick={onClick}
        className={`w-full h-full px-2 rounded border border-primary rounded-r-xl rounded-l-none focus:outline-none`}
      />
    </div>
  )
}