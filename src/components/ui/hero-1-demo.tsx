import { Hero1 } from "@/components/ui/hero-1";
import logo from "../../../logo.png";

export default function DemoOne() {
  return (
    <Hero1
      logoSrc={logo}
      onBack={() => {}}
      onContinue={() => {}}
      continueDisabled={false}
    >
      <div />
    </Hero1>
  );
}
