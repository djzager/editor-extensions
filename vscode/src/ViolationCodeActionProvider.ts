import * as vscode from "vscode";
import { ExtensionState } from "./extensionState";
import { EnhancedIncident } from "@editor-extensions/shared";
import { Immutable } from "immer";

export class ViolationCodeActionProvider implements vscode.CodeActionProvider {
  static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

  constructor(private state: ExtensionState) {}

  private findMatchingIncident(
    diagnostic: vscode.Diagnostic,
    document: vscode.TextDocument,
  ): Immutable<EnhancedIncident> | undefined {
    // Convert from VSCode's 0-based line numbers back to analyzer's 1-based line numbers
    const lineNumber = diagnostic.range.start.line + 1;
    return this.state.data.enhancedIncidents.find(
      (incident) => incident.uri === document.uri.toString() && incident.lineNumber === lineNumber,
    );
  }

  async provideCodeActions(
    document: vscode.TextDocument,
    _range: vscode.Range,
    context: vscode.CodeActionContext,
    _token: vscode.CancellationToken,
  ): Promise<vscode.CodeAction[]> {
    const actions: vscode.CodeAction[] = [];
    const continueExt = vscode.extensions.getExtension("Continue.continue");

    for (const diagnostic of context.diagnostics) {
      if (diagnostic.source === "konveyor") {
        const incident = this.findMatchingIncident(diagnostic, document);
        if (incident) {
          // Add Ask Kai action
          const askKaiAction = new vscode.CodeAction("Ask Kai", vscode.CodeActionKind.QuickFix);
          askKaiAction.command = {
            command: "konveyor.getSolution",
            title: "Ask Kai",
            arguments: [[incident], this.state.data.solutionEffort],
          };
          askKaiAction.diagnostics = [diagnostic];
          askKaiAction.isPreferred = true;
          actions.push(askKaiAction);

          // Add Ask Continue action if Continue is installed
          if (continueExt) {
            const askContinueAction = new vscode.CodeAction(
              "Ask Continue with Konveyor Context",
              vscode.CodeActionKind.QuickFix,
            );
            const prompt = `Help me address this Konveyor migration issue:
Rule: ${incident.ruleset_name} - ${incident.ruleset_description}
Violation: ${incident.violation_name} - ${incident.violation_description}
Category: ${incident.violation_category}
Message: ${incident.message}`;

            // Create a range that includes 5 lines before and after the diagnostic
            const surroundingRange = new vscode.Range(
              Math.max(0, diagnostic.range.start.line - 5),
              0,
              Math.min(document.lineCount - 1, diagnostic.range.end.line + 5),
              0,
            );

            askContinueAction.command = {
              command: "continue.customQuickActionSendToChat",
              title: "Ask Continue with Konveyor Context",
              arguments: [prompt, surroundingRange],
            };
            askContinueAction.diagnostics = [diagnostic];
            actions.push(askContinueAction);
          }
        }
      }
    }

    return actions;
  }
}
