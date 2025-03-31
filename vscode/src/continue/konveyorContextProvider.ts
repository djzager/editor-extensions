import * as vscode from "vscode";
import {
  ContextItem,
  ContextProviderDescription,
  ContextProviderExtras,
  IContextProvider,
  LoadSubmenuItemsArgs,
  ContextSubmenuItem,
} from "./types";
import { ExtensionState } from "../extensionState";

export class KonveyorContextProvider implements IContextProvider {
  constructor(private state: ExtensionState) {
    console.log("KonveyorContextProvider constructor", this.state);
  }

  get description(): ContextProviderDescription {
    console.log("Getting description");
    return {
      title: "Konveyor",
      displayTitle: "Konveyor Analysis",
      description: "Provides Konveyor analysis results and recommendations",
      type: "submenu",
    };
  }

  private generateUniqueId(incident: any): string {
    const parts = [
      incident.violationId || "",
      incident.uri || "",
      incident.lineNumber?.toString() || "",
    ];
    return parts.filter((part) => part !== "").join("::");
  }

  async loadSubmenuItems(args: LoadSubmenuItemsArgs): Promise<ContextSubmenuItem[]> {
    console.log("loadSubmenuItems called with args:", args);
    console.log("Current state:", this.state);
    console.log("Enhanced incidents:", this.state.data.enhancedIncidents);

    if (!this.state.data.enhancedIncidents) {
      console.log("Enhanced incidents is undefined");
      return [
        {
          id: "no-incidents",
          title: "No Analysis Results",
          description: "No Konveyor analysis results available",
        },
      ];
    }

    if (this.state.data.enhancedIncidents.length === 0) {
      console.log("Enhanced incidents array is empty");
      return [
        {
          id: "no-incidents",
          title: "No Analysis Results",
          description: "No Konveyor analysis results available",
        },
      ];
    }

    console.log("Mapping incidents to submenu items");
    const items = this.state.data.enhancedIncidents.map((incident) => ({
      id: this.generateUniqueId(incident),
      title: incident.violation_name || incident.violationId || "Unknown Issue",
      description: `${incident.violation_category || "Uncategorized"} - ${incident.uri}`,
      metadata: {
        violation_description: incident.violation_description || incident.message,
        ruleset_name: incident.ruleset_name,
        ruleset_description: incident.ruleset_description,
        violation_labels: incident.violation_labels,
        lineNumber: incident.lineNumber,
        violationId: incident.violationId,
        uri: incident.uri,
      },
    }));
    console.log("Generated submenu items:", items);
    return items;
  }

  async getContextItems(query: string, extras: ContextProviderExtras): Promise<ContextItem[]> {
    console.log("getContextItems called with query:", query);
    const items: ContextItem[] = [];

    // Parse the unique ID back into its components
    const [violationId, uri, lineNumber] = query.split("::");

    // Find the incident that matches the selected submenu item using all components
    const selectedIncident = this.state.data.enhancedIncidents.find(
      (incident) =>
        (incident.violationId === violationId || !violationId) &&
        (incident.uri === uri || !uri) &&
        (incident.lineNumber?.toString() === lineNumber || !lineNumber),
    );

    if (selectedIncident) {
      items.push({
        name: `Analysis Result: ${selectedIncident.violation_name || selectedIncident.violationId}`,
        description: `Migration issue found in ${selectedIncident.uri}`,
        content: `Rule: ${selectedIncident.violation_name || selectedIncident.violationId}\nDescription: ${selectedIncident.violation_description || selectedIncident.message}\nCategory: ${selectedIncident.violation_category || "Uncategorized"}\n\nContext:\n- Ruleset: ${selectedIncident.ruleset_name || "Unknown"}\n- Ruleset Description: ${selectedIncident.ruleset_description || "No description"}\n- Labels: ${selectedIncident.violation_labels?.join(", ") || "None"}`,
        range: selectedIncident.lineNumber
          ? {
              filepath: vscode.Uri.parse(selectedIncident.uri).toString(),
              range: {
                start: { line: selectedIncident.lineNumber - 5, character: 0 },
                end: { line: selectedIncident.lineNumber + 5, character: 0 },
              },
            }
          : undefined,
      });
    }

    console.log("Returning context items:", items);
    return items;
  }
}
