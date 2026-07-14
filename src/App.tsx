import { useLowPower } from "./lib/useLowPower";
import { Preloader } from "./components/Preloader";
import { Universe } from "./universe/Universe";
import { ClassicSite } from "./ClassicSite";

export function App() {
  const low = useLowPower();

  return (
    <>
      <Preloader onDone={() => {}} />
      {/* Full 3D universe on capable devices; classic scroll site as fallback. */}
      {low ? <ClassicSite /> : <Universe />}
    </>
  );
}
