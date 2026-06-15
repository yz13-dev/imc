import { cn } from "@workspace/ui/lib/utils";
import Image, { ImageProps } from "next/image";

export type ThemeImageProps = Omit<ImageProps, "src"> & {
  srcLight: ImageProps["src"];
  srcDark: ImageProps["src"];
};

export default function ThemeImage(props: ThemeImageProps) {
  const { srcLight, srcDark, className = "", ...rest } = props;

  return (
    <>
      <Image {...rest} src={srcLight} className={cn("imgLight", className)} />
      <Image {...rest} src={srcDark} className={cn("imgDark", className)} />
    </>
  );
};
