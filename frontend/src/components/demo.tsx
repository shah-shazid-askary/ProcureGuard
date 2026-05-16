import GLSLHills from "@/components/ui/glsl-hills";

export default function DemoOne() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-black min-h-screen">
      <GLSLHills />
      <div className="space-y-6 pointer-events-none z-10 text-center absolute">
        <h1 className="font-semibold text-7xl whitespace-pre-wrap text-white">
          <span className="italic text-6xl font-thin text-zinc-400">Designs That Speak <br /> </span>
          Louder Than Words
        </h1>
        <p className="text-sm text-zinc-500 max-w-md mx-auto">
          We craft stunning visuals and user-friendly experiences that help your brand stand out and connect with your audience.
        </p>
      </div>
    </div>
  )
}
