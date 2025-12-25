"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Sparkles, ArrowRight, Play, Network, Trash2, GripVertical, Edit2, Plus, Loader2 } from "lucide-react"
import { PlanStep } from "@/lib/agents/planner"

interface DeepResearchPanelProps {
    apiKey: string;
}

export function DeepResearchPanel({ apiKey }: DeepResearchPanelProps) {
    const [objective, setObjective] = useState("")
    const [isGenerating, setIsGenerating] = useState(false)
    const [plan, setPlan] = useState<PlanStep[]>([])
    const [isExecuting, setIsExecuting] = useState(false)

    const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null)
    const [editParamsJson, setEditParamsJson] = useState("")

    // Execution State
    const [jobId, setJobId] = useState<string | null>(null)
    const [logs, setLogs] = useState<any[]>([])
    const [status, setStatus] = useState<"idle" | "running" | "completed">("idle")
    const [result, setResult] = useState<any>(null)
    
    // Additional Keys for Execution
    const [tavilyKey, setTavilyKey] = useState("")
    const [mixedbreadKey, setMixedbreadKey] = useState("")
    const [pineconeKey, setPineconeKey] = useState("")
    const [pineconeIndex, setPineconeIndex] = useState("research-data")
    const [showConfig, setShowConfig] = useState(false)

    // Poll for status
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (jobId && status === "running") {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/research/status?id=${jobId}`);
                    const data = await res.json();
                    if (data.logs) setLogs(data.logs);
                    if (data.result) setResult(data.result);
                    if (data.status === "completed" || data.status === "failed") {
                        setStatus("completed");
                        setIsExecuting(false);
                        toast.success("Plan Execution Completed!");
                        clearInterval(interval);
                    }
                } catch (e) { console.error(e) }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [jobId, status]);

    const openEdit = (index: number) => {
        setEditingStepIndex(index);
        setEditParamsJson(JSON.stringify(plan[index].params, null, 2));
    }

    const saveEdit = () => {
        if (editingStepIndex === null) return;
        try {
            const newParams = JSON.parse(editParamsJson);
            const newPlan = [...plan];
            newPlan[editingStepIndex].params = newParams;
            setPlan(newPlan);
            setEditingStepIndex(null);
            toast.success("Step updated");
        } catch (e) {
            toast.error("Invalid JSON");
        }
    }

    const handleExecute = async () => {
        if (!tavilyKey) {
            toast.error("Tavily API Key is required for research");
            return;
        }
        
        // Check if vector steps exist
        const hasVector = plan.some(s => s.type === "vector_embed");
        if (hasVector && (!mixedbreadKey || !pineconeKey)) {
             toast.error("Vector Store keys are required for this plan.");
             return;
        }

        setIsExecuting(true);
        setShowConfig(false);
        setStatus("running");
        
        try {
            const res = await fetch("/api/agent/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    plan,
                    apiKeys: {
                        groq: apiKey,
                        tavily: tavilyKey,
                        mixedbread: mixedbreadKey,
                        pinecone: pineconeKey
                    }
                })
            });
            const data = await res.json();
            if (data.success) {
                setJobId(data.jobId);
                toast.success("Execution Started");
            } else {
                throw new Error(data.error);
            }
        } catch (e: any) {
            toast.error("Execution failed: " + e.message);
            setIsExecuting(false);
            setStatus("idle");
        }
    }

    const handleGeneratePlan = async () => {
        console.log("Generating plan...", { objective, apiKey });
        if (!objective.trim()) {
            console.log("Objective is empty");
            return;
        }
        if (!apiKey) {
            console.log("API Key missing");
            toast.error("Please set your Groq API Key in settings first.");
            return;
        }

        setIsGenerating(true)
        setPlan([])

        try {
            const res = await fetch("/api/planner", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userInput: objective, apiKey })
            });
            const data = await res.json();
            
            if (data.success) {
                setPlan(data.plan);
                toast.success("Plan generated! You can now edit the flow.");
            } else {
                 throw new Error(data.error);
            }
        } catch (e: any) {
            toast.error("Failed to generate plan: " + e.message);
        } finally {
            setIsGenerating(false);
        }
    }

    const removeStep = (index: number) => {
        const newPlan = [...plan];
        newPlan.splice(index, 1);
        setPlan(newPlan);
    }
    
    return (
        <div className="space-y-8 animate-in fade-in duration-500 relative">
            {/* Edit Modal / Overlay */}
            {editingStepIndex !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className="w-full max-w-lg">
                        <CardHeader>
                            <CardTitle>Edit Step Parameters</CardTitle>
                            <CardDescription>Modify the JSON parameters for this step.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea 
                                value={editParamsJson} 
                                onChange={(e) => setEditParamsJson(e.target.value)} 
                                className="font-mono h-48"
                            />
                        </CardContent>
                        <CardFooter className="justify-end gap-2">
                            <Button variant="ghost" onClick={() => setEditingStepIndex(null)}>Cancel</Button>
                            <Button onClick={saveEdit}>Save Changes</Button>
                        </CardFooter>
                    </Card>
                </div>
            )}

            {/* Config Modal */}
            {showConfig && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className="w-full max-w-lg">
                        <CardHeader>
                            <CardTitle>Configure Execution</CardTitle>
                            <CardDescription>Enter API keys required for this plan.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Tavily API Key (Required for Research)</Label>
                                <Input type="password" value={tavilyKey} onChange={e => setTavilyKey(e.target.value)} placeholder="tvly-..." />
                            </div>
                            {plan.some(s => s.type === "vector_embed") && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Mixedbread API Key</Label>
                                        <Input type="password" value={mixedbreadKey} onChange={e => setMixedbreadKey(e.target.value)} placeholder="mxb-..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Pinecone API Key</Label>
                                        <Input type="password" value={pineconeKey} onChange={e => setPineconeKey(e.target.value)} placeholder="pc-..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Pinecone Index Name</Label>
                                        <Input value={pineconeIndex} onChange={e => setPineconeIndex(e.target.value)} placeholder="research-data" />
                                    </div>
                                </>
                            )}
                        </CardContent>
                        <CardFooter className="flex-col gap-2">
                             {(!tavilyKey || (plan.some(s => s.type === "vector_embed") && (!mixedbreadKey || !pineconeKey))) && (
                                <div className="text-xs text-destructive font-medium w-full text-center">
                                    * Please fill in all required API keys to proceed.
                                </div>
                             )}
                            <div className="flex justify-end gap-2 w-full">
                                <Button variant="ghost" onClick={() => setShowConfig(false)}>Cancel</Button>
                                <Button onClick={handleExecute} disabled={isExecuting}>
                                    Start Execution
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            )}

            {/* Input Section */}
            <section className="max-w-3xl mx-auto space-y-4">
                <div className="text-center space-y-2">
                     <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                        <Sparkles className="text-primary hidden md:block" />
                        Human-in-the-Loop Deep Research
                     </h2>
                     <p className="text-muted-foreground">
                        Describe your research goal. Our Agent will architect a custom pipeline for you.
                     </p>
                </div>

                <div className="flex flex-col gap-4 p-6 bg-card border rounded-xl shadow-sm">
                    <Label htmlFor="objective" className="text-base font-medium">Research Objective</Label>
                    <Textarea 
                        id="objective"
                        placeholder="e.g., 'Analyze the top 5 AI startups in Bangalore, find their funding history, and save the summary to memory.'" 
                        className="text-base min-h-[100px] resize-none"
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                    />
                    <Button 
                        size="lg" 
                        className="w-full md:w-auto self-end font-semibold shadow-lg shadow-primary/20"
                        onClick={handleGeneratePlan}
                        disabled={isGenerating || !objective || isExecuting}
                    >
                        {isGenerating ? (
                            <>
                                <Network className="mr-2 h-4 w-4 animate-spin" />
                                Architecting Plan...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate Plan
                            </>
                        )}
                    </Button>
                </div>
            </section>

             {/* Live Logs - only show when running */}
            {status !== "idle" && (
                <Card className="max-w-3xl mx-auto border-primary/50">
                    <CardHeader>
                         <CardTitle className="text-lg flex items-center gap-2">
                            <Network className="h-5 w-5 animate-pulse text-primary"/> 
                            Execution Live Logs
                         </CardTitle>
                    </CardHeader>
                     <CardContent className="h-64 overflow-y-auto bg-muted/50 font-mono text-xs p-4 rounded-b-lg">
                        {logs.slice().reverse().map((log, i) => (
                             <div key={i} className="mb-1">
                                 <span className={`font-bold ${log.type === 'SUCCESS' ? 'text-green-500' : 'text-blue-500'}`}>[{log.type}]</span> {log.message}
                             </div>
                        ))}
                        {logs.length === 0 && <span className="text-muted-foreground">Waiting for logs...</span>}
                     </CardContent>
                </Card>
            )}

            {/* Plan Visualization (Flowchart UI) */}
            {plan.length > 0 && (
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                         <h3 className="text-xl font-semibold flex items-center gap-2">
                            <Network className="h-5 w-5" />
                            Proposed Execution Flow
                         </h3>
                    </div>
                    
                    <div className="relative flex flex-col items-center gap-4 py-8">
                         {/* Connecting Line Layer */}
                         <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-border -z-10 hidden md:block" />

                         {plan.map((step, index) => (
                             <div key={step.id || index} className="relative w-full max-w-2xl group">
                                 {/* Step Card */}
                                 <Card className={`relative border-2 transition-all hover:border-primary/50 hover:shadow-md ${step.type === 'vector_embed' ? 'bg-secondary/20' : 'bg-card'}`}>
                                     
                                     {/* Index Badge */}
                                     <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold ring-4 ring-background z-10 md:-left-12 md:w-8 md:h-8 md:text-sm">
                                         {index + 1}
                                     </div>

                                     <CardHeader className="pb-2">
                                         <div className="flex justify-between items-start">
                                             <div className="space-y-1">
                                                 <div className="text-xs font-mono uppercase text-muted-foreground tracking-wider bg-secondary px-2 py-0.5 rounded w-fit">
                                                    {step.type.replace('_', ' ')}
                                                 </div>
                                                 <CardTitle className="text-lg">{step.label}</CardTitle>
                                             </div>
                                             <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <Button variant="ghost" size="icon" onClick={() => openEdit(index)}>
                                                     <Edit2 className="h-4 w-4 text-muted-foreground" />
                                                  </Button>
                                                  <Button variant="ghost" size="icon" onClick={() => removeStep(index)}>
                                                      <Trash2 className="h-4 w-4 text-destructive" />
                                                  </Button>
                                             </div>
                                         </div>
                                         <CardDescription>
                                             {step.description}
                                         </CardDescription>
                                     </CardHeader>

                                     <CardContent>
                                         {/* Parameters Preview */}
                                         <div className="bg-muted/50 p-3 rounded text-xs font-mono text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer hover:bg-muted" onClick={() => openEdit(index)}>
                                             {JSON.stringify(step.params).slice(0, 80)}{JSON.stringify(step.params).length > 80 ? '...' : ''}
                                         </div>
                                     </CardContent>
                                 </Card>

                                 {/* Arrow Down Mobile */}
                                 {index < plan.length - 1 && (
                                     <div className="flex justify-center py-2 md:hidden">
                                         <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90" />
                                     </div>
                                 )}
                             </div>
                         ))}
                    </div>

                    <div className="flex justify-center gap-4 pt-4">
                        {isExecuting ? (
                            <Button 
                                size="lg" 
                                variant="destructive"
                                className="px-8 text-lg"
                                onClick={async () => {
                                    if(!jobId) return;
                                    try {
                                        await fetch("/api/research/cancel", {
                                            method: "POST",
                                            body: JSON.stringify({ jobId })
                                        });
                                        toast.info("Stop requested...");
                                        setIsExecuting(false);
                                        setStatus("completed"); // Force complete state on UI
                                    } catch(e) {
                                        toast.error("Failed to stop");
                                    }
                                }}
                            >
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Stop Execution
                            </Button>
                        ) : (
                            <Button 
                                size="lg" 
                                className="px-8 text-lg" 
                                onClick={() => setShowConfig(true)}
                            >
                                <Play className="mr-2 h-5 w-5 fill-current" />
                                Execute Plan
                            </Button>
                        )}
                    </div>
                </section>
            )}
            {/* Final Result Display */}
            {result && (
                <Card className="max-w-3xl mx-auto border-green-500/50 shadow-lg shadow-green-500/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-600">
                            <Sparkles className="h-5 w-5" />
                            Final Research Output
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="bg-muted/30 p-6 rounded-b-lg overflow-x-auto">
                        <pre className="whitespace-pre-wrap font-mono text-sm text-foreground">
                            {typeof result.finalOutput === 'string' 
                                ? result.finalOutput 
                                : JSON.stringify(result, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

