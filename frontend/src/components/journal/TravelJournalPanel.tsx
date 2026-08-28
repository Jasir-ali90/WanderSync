import { BookOpen, Sparkles, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function TravelJournalPanel() {
  const story = `✨ Your Hunza Adventure — A 7-Day Journey Through the Majestic Karakoram

Day 1: Arrived in Gilgit and drove along the winding Karakoram Highway to Karimabad. The view of Rakaposhi peak bathed in golden sunset light was breathtaking.
Day 2: Explored Baltit Fort & Altit Fort, enjoying traditional Hunza walnut cake and local tea.
Day 3: Boated across the turquoise waters of Attabad Lake and walked across the thrilling Hussaini Suspension Bridge.`;

  const handleExportPDF = () => {
    alert("✨ Generating & Exporting your VVIP Memory Book PDF...");
  };

  return (
    <div className="space-y-6 rounded-3xl border border-blue-200 bg-white p-6 backdrop-blur-2xl shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-300/60 pb-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <BookOpen className="size-5 text-blue-600" /> AI Travel Journal & Memory Book
          </h3>
          <p className="text-xs text-slate-500">AI automatically compiles your trip notes, weather memories, and photos into an exportable storybook.</p>
        </div>
        <Button size="sm" onClick={handleExportPDF} className="rounded-xl">
          <Download className="size-4 mr-1" /> Export Memory PDF
        </Button>
      </div>

      {/* Storybook Content */}
      <div className="rounded-2xl border border-blue-200 bg-slate-50/80 p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
          <Sparkles className="size-4 text-blue-600 animate-spin" />
          <span>AI GENERATED TRAVEL STORYBOOK</span>
        </div>

        <p className="whitespace-pre-line text-xs leading-relaxed text-slate-600 font-mono">
          {story}
        </p>

        {/* Photo Gallery Mock */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          {["photo-1506744038136-46273834b3fb", "photo-1512453979798-5ea266f8880c", "photo-1542051841857-5f90071e7989"].map((img, idx) => (
            <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-slate-300">
              <img src={`https://images.unsplash.com/${img}?auto=format&fit=crop&w=400&q=80`} alt="Memory" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
