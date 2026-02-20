import { open } from "@tauri-apps/plugin-dialog";
import { mkdir, writeTextFile } from "@tauri-apps/plugin-fs";
import {
  FolderOpenIcon,
  FolderPlusIcon,
  ClockIcon,
  XIcon,
  FileTextIcon,
} from "lucide-react";
import { useProjectStore } from "@/stores/project-store";
import { useDocumentStore } from "@/stores/document-store";
import { Button } from "@/components/ui/button";
import { exists, join } from "@/lib/tauri/fs";

const DEFAULT_MAIN_TEX = `\\documentclass[12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{amsmath,amssymb}
\\usepackage{graphicx}
\\usepackage[margin=1in]{geometry}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{booktabs}
\\usepackage{float}

\\title{Sample Document}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
This is a sample LaTeX document demonstrating common features including
math equations, tables, lists, and cross-references.
\\end{abstract}

\\tableofcontents

\\section{Introduction}

Welcome to your new LaTeX project. This template includes examples of
commonly used features to help you get started.

You can reference other sections like Section~\\ref{sec:math} or
Section~\\ref{sec:tables}.

\\section{Mathematics}
\\label{sec:math}

\\subsection{Inline and Display Math}

Euler's identity is $e^{i\\pi} + 1 = 0$. The quadratic formula is:
\\begin{equation}
  x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
  \\label{eq:quadratic}
\\end{equation}

We can refer to Equation~\\ref{eq:quadratic} anywhere in the document.

\\subsection{Aligned Equations}

\\begin{align}
  \\nabla \\cdot \\mathbf{E}  &= \\frac{\\rho}{\\epsilon_0} \\\\
  \\nabla \\cdot \\mathbf{B}  &= 0 \\\\
  \\nabla \\times \\mathbf{E} &= -\\frac{\\partial \\mathbf{B}}{\\partial t} \\\\
  \\nabla \\times \\mathbf{B} &= \\mu_0 \\mathbf{J} + \\mu_0 \\epsilon_0 \\frac{\\partial \\mathbf{E}}{\\partial t}
\\end{align}

\\subsection{Matrices}

\\[
A = \\begin{pmatrix}
  1 & 2 & 3 \\\\
  4 & 5 & 6 \\\\
  7 & 8 & 9
\\end{pmatrix}
\\]

\\section{Lists}

\\subsection{Itemized List}

\\begin{itemize}
  \\item First item
  \\item Second item with a nested list:
    \\begin{itemize}
      \\item Sub-item A
      \\item Sub-item B
    \\end{itemize}
  \\item Third item
\\end{itemize}

\\subsection{Enumerated List}

\\begin{enumerate}
  \\item Prepare the data
  \\item Run the analysis
  \\item Interpret the results
\\end{enumerate}

\\section{Tables}
\\label{sec:tables}

\\begin{table}[H]
  \\centering
  \\caption{Sample results}
  \\label{tab:results}
  \\begin{tabular}{lrr}
    \\toprule
    Method & Accuracy (\\%) & Time (s) \\\\
    \\midrule
    Baseline  & 85.2 & 1.3 \\\\
    Proposed  & 92.7 & 2.1 \\\\
    Enhanced  & 94.1 & 3.5 \\\\
    \\bottomrule
  \\end{tabular}
\\end{table}

See Table~\\ref{tab:results} for a comparison of methods.

\\section{Figures}

% Uncomment the following when you have an image file:
% \\begin{figure}[H]
%   \\centering
%   \\includegraphics[width=0.8\\textwidth]{example-image}
%   \\caption{An example figure.}
%   \\label{fig:example}
% \\end{figure}

\\section{Conclusion}

This document demonstrated the basics of LaTeX. Edit freely and use
the AI assistant (press the chat icon) to help you write.

\\end{document}
`;

export function ProjectPicker() {
  const recentProjects = useProjectStore((s) => s.recentProjects);
  const addRecentProject = useProjectStore((s) => s.addRecentProject);
  const removeRecentProject = useProjectStore((s) => s.removeRecentProject);
  const openProject = useDocumentStore((s) => s.openProject);

  const handleOpenFolder = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Open LaTeX Project Folder",
    });
    if (selected) {
      addRecentProject(selected);
      await openProject(selected);
    }
  };

  const handleNewProject = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Choose Folder for New Project",
    });
    if (!selected) return;

    const mainTexPath = await join(selected, "main.tex");
    const mainExists = await exists(mainTexPath);
    if (!mainExists) {
      await mkdir(selected, { recursive: true }).catch(() => {});
      await writeTextFile(mainTexPath, DEFAULT_MAIN_TEX);
    }

    addRecentProject(selected);
    await openProject(selected);
  };

  const handleOpenRecent = async (path: string) => {
    addRecentProject(path);
    await openProject(path);
  };

  return (
    <div className="flex h-full items-center justify-center bg-background">
      <div className="flex w-full max-w-md flex-col items-center gap-8 px-8">
        <div className="flex flex-col items-center gap-2">
          <FileTextIcon className="size-12 text-primary" />
          <h1 className="font-bold text-2xl">Open-Prism</h1>
          <p className="text-center text-muted-foreground text-sm">
            AI-powered LaTeX writing workspace
          </p>
        </div>

        <div className="flex w-full gap-3">
          <Button
            onClick={handleNewProject}
            size="lg"
            variant="outline"
            className="flex-1 gap-2"
          >
            <FolderPlusIcon className="size-5" />
            New Project
          </Button>
          <Button
            onClick={handleOpenFolder}
            size="lg"
            className="flex-1 gap-2"
          >
            <FolderOpenIcon className="size-5" />
            Open Folder
          </Button>
        </div>

        {recentProjects.length > 0 && (
          <div className="w-full">
            <div className="mb-3 flex items-center gap-2 text-muted-foreground text-sm">
              <ClockIcon className="size-4" />
              <span>Recent Projects</span>
            </div>
            <div className="space-y-1">
              {recentProjects.map((project) => (
                <div
                  key={project.path}
                  className="group flex items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-muted"
                >
                  <button
                    className="flex flex-1 flex-col items-start overflow-hidden text-left"
                    onClick={() => handleOpenRecent(project.path)}
                  >
                    <span className="truncate font-medium text-sm">
                      {project.name}
                    </span>
                    <span className="truncate text-muted-foreground text-xs">
                      {project.path}
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 shrink-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecentProject(project.path);
                    }}
                  >
                    <XIcon className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
