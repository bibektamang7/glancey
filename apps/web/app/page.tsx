import Hero from "@/pages/Hero/Hero";
import { BackgroundBeams } from "@/components/ui/background-beams";

export default function Home() {
	return (
		<div className="!h-full relative">
			<Hero />
			<BackgroundBeams />
		</div>
	);
}
