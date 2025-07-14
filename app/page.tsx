import CrossfadeImage from "@/app/ui/crossfade-image";

const images = [
  "/carousel/img1.png",
  "/carousel/img2.png",
  "/carousel/img3.png",
  "/carousel/img4.png",
  "/carousel/img5.png",
];

export default function Home() {
  return (
    <div className="relative w-full my-6 h-[400px]">
      <CrossfadeImage
        images={images}
        className="rounded-lg"
        intervalMs={5000}
      />
    </div>
  );
}
