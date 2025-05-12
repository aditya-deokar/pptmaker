import { useTheme } from "next-themes";

export const Plus = () => {
  const {theme} = useTheme();
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      suppressHydrationWarning
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 4C12.5523 4 13 4.44772 13 5L13 19C13 19.5523 12.5523 20 12 20C11.4477 20 11 19.5523 11 19L11 5C11 4.44772 11.4477 4 12 4Z"
        suppressHydrationWarning
        fill={theme === "light" ? "#F9F9F9" : "#292B2F"} 
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4 12C4 11.4477 4.44772 11 5 11H19C19.5523 11 20 11.4477 20 12C20 12.5523 19.5523 13 19 13H5C4.44772 13 4 12.5523 4 12Z"
        suppressHydrationWarning
       fill={theme === "light" ? "#F4F2F2" : "#292B2F"}
      />
    </svg>
  );
};
