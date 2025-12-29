import { useEffect } from "react";

const Animations = {
  "duck-send": "/animation/duck-send.json",
  "duck-colors": "/animation/duck-colors.json",
  "duck-count": "/animation/duck-count.json",
  "duck-dive": "/animation/duck-dive.json",
};

type AnimationType = keyof typeof Animations;

interface Props {
  name: AnimationType;
  style: React.CSSProperties;
}

export const AnimationPlayer = ({ name, style }: Props) => {
  return <lottie-player src={Animations[name]} loop autoplay style={style} />;
};

export const useImportAnimationPlayer = () => {
  useEffect(() => {
    import("@lottiefiles/lottie-player");
  });
};
