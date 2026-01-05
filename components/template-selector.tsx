"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { BookTemplate, ChevronDown } from "lucide-react"
import { RESEARCH_TEMPLATES, ResearchTemplate } from "@/lib/constants/research-templates"

interface TemplateSelectorProps {
  onSelect: (template: ResearchTemplate) => void
}

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto text-xs lg:text-sm">
          <BookTemplate className="mr-2 h-4 w-4" />
          Load Template
          <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Research Templates</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {RESEARCH_TEMPLATES.map((template) => (
          <DropdownMenuItem
            key={template.id}
            onClick={() => onSelect(template)}
            className="cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="font-medium">{template.name}</span>
              <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                {template.description}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
