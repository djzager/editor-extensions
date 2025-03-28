import {
  ContextItem,
  ContextProviderDescription,
  ContextProviderExtras,
  IContextProvider,
} from "./types";
import { ExtensionState } from "../extensionState";

export class KonveyorContextProvider implements IContextProvider {
  constructor(private state: ExtensionState) {}

  get description(): ContextProviderDescription {
    return {
      title: "Konveyor",
      displayTitle: "Konveyor Analysis",
      description: "Provides Konveyor analysis results and recommendations",
      type: "normal",
    };
  }

  async getContextItems(query: string, extras: ContextProviderExtras): Promise<ContextItem[]> {
    const items: ContextItem[] = [];

    // Add analysis results if available
    if (this.state.data.enhancedIncidents.length > 0) {
      const analysisResults = this.state.data.enhancedIncidents.map((incident) => ({
        name: `Analysis Result: ${incident.violation_name || incident.violationId}`,
        description: `Migration issue found in ${incident.uri}`,
        content: `Rule: ${incident.violation_name || incident.violationId}\nDescription: ${incident.violation_description || incident.message}\nCategory: ${incident.violation_category || "Uncategorized"}\n\nContext:\n- Ruleset: ${incident.ruleset_name || "Unknown"}\n- Ruleset Description: ${incident.ruleset_description || "No description"}\n- Labels: ${incident.violation_labels?.join(", ") || "None"}`,
        range: incident.lineNumber
          ? {
              filepath: incident.uri,
              range: {
                start: { line: incident.lineNumber - 1, character: 0 },
                end: { line: incident.lineNumber - 1, character: 0 },
              },
            }
          : undefined,
      }));
      items.push(...analysisResults);
    }

    return items;
  }
}
