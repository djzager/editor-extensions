import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import * as vscode from "vscode";
// import * as rpc from "vscode-jsonrpc/node";
import path from "path";

export class AnalyzerClient {
  private config: vscode.WorkspaceConfiguration | null = null;
  private extContext: vscode.ExtensionContext | null = null;
  private analyzerServer: ChildProcessWithoutNullStreams | null = null;
  private outputChannel: vscode.OutputChannel;
  // private rpcConnection: rpc.MessageConnection | null = null;
  private requestId: number = 1;

  constructor(context: vscode.ExtensionContext) {
    this.extContext = context;
    this.outputChannel = vscode.window.createOutputChannel("Konveyor-Analyzer");
    this.config = vscode.workspace.getConfiguration("konveyor");
  }

  // Stops the analyzer server
  public stop(): void {
    if (this.analyzerServer) {
      this.analyzerServer.kill();
    }
    // this.rpcConnection = null;
    this.analyzerServer = null;
  }

  // Initializes the analyzer by sending the "initialize" request
  // TODO(djzager): For now this is unused but we will want it when
  // we actually make an initialize call
  // public async initialize() {
  //   if (this.rpcConnection) {
  //     throw new Error("Analyzer server is already running.");
  //   }

  //   // Create a JSON-RPC connection over stdio
  //   this.analyzerServer = spawn(this.getAnalyzerPath(), this.getAnalyzerArgs());

  //   // Listen for log messages from stderr and push them to the outputChannel
  //   this.analyzerServer.stderr.on("data", (data) => {
  //     this.outputChannel?.appendLine(`${data.toString()}`);
  //   });

  //   this.rpcConnection = rpc.createMessageConnection(
  //     new rpc.StreamMessageReader(this.analyzerServer?.stdout),
  //     new rpc.StreamMessageWriter(this.analyzerServer?.stdin),
  //   );

  //   // Start the JSON-RPC connection
  //   this.rpcConnection.listen();

  //   // TODO(djzager): Investigate why we can't use the normal jsonrpc client
  //   // return new Promise((resolve, reject) => {
  //   //   this.rpcConnection
  //   //     ?.sendRequest("analysis_engine.Initialize", [
  //   //       {
  //   //         workers: this.getNumWorkers(),
  //   //         limit_incidents: this.getIncidentLimit(),
  //   //         limit_code_snips: this.getCodeSnipLimit(),
  //   //         context_lines: this.getContextLines(),
  //   //         location: vscode.workspace.workspaceFolders![0].uri.fsPath,
  //   //         incident_selector: "",
  //   //         rule_files: [],
  //   //         java_config: {},
  //   //         analysis_mode: "source-only",
  //   //       },
  //   //     ])
  //   //     .then((response) => resolve(response))
  //   //     .catch((error) => reject(error));
  //   // });
  //   const request =
  //     JSON.stringify({
  //       jsonrpc: "2.0",
  //       id: this.requestId++,
  //       method: "analysis_engine.Initialize",
  //       params: [
  //         {
  //           workers: this.getNumWorkers(),
  //           limit_incidents: this.getIncidentLimit(),
  //           limit_code_snips: this.getCodeSnipLimit(),
  //           context_lines: this.getContextLines(),
  //           location: vscode.workspace.workspaceFolders![0].uri.fsPath,
  //           incident_selector: "",
  //           rule_files: this.getRules(),
  //           java_config: this.getJavaConfig(),
  //           analysis_mode: "source-only",
  //         },
  //       ],
  //     }) + "\n";
  //   this.analyzerServer?.stdin.write(request);
  //   await new Promise((resolve) => setTimeout(resolve, 1000));
  // }

  public start(): void {
    if (!this.canAnalyze) {
      return;
    }
    this.analyzerServer = spawn(this.getAnalyzerPath(), this.getAnalyzerArgs());
    this.analyzerServer.stderr.on("data", (data) => {
      this.outputChannel.appendLine(`${data.toString()}`);
    });

    this.analyzerServer.on("exit", (code) => {
      this.outputChannel.appendLine(`Analyzer exited with code ${code}`);
    });
  }

  public async runAnalysis(): Promise<any> {
    if (!this.analyzerServer) {
      throw new Error("Server not started");
    }

    const request =
      JSON.stringify({
        jsonrpc: "2.0",
        id: this.requestId++,
        method: "analysis_engine.Analyze",
        params: [
          {
            label_selector: this.getLabelSelector(),
          },
        ],
      }) + "\n";
    this.analyzerServer?.stdin.write(request);

    this.analyzerServer.stdout.once("data", (data) => {
      this.outputChannel.appendLine(data);
    });
  }

  // Runs analysis by sending the "analyze" request
  //   public async runAnalysis(params: any): Promise<RuleSet[]> {
  //     if (!this.rpcConnection) {
  //       throw new Error("Analyzer server is not running.");
  //     }
  //     try {
  //       const response = await this.sendRequest("analyze", params);
  //       return this.parseRuleSetResponse(response);
  //     } catch (error) {
  //       console.error("Analysis failed:", error.message);
  //       throw error;
  //     }
  //   }
  // Sends a JSON-RPC request and waits for a response
  // private sendRequest(method: string, params: any): Promise<any> {
  //   return new Promise((resolve, reject) => {
  //     this.rpcConnection
  //       ?.sendRequest(method, params)
  //       .then((response) => resolve(response))
  //       .catch((error) => reject(error));
  //   });
  // }

  public async canAnalyze(): Promise<boolean> {
    const labelSelector = this.config!.get("labelSelector") as string;

    if (!labelSelector) {
      const selection = await vscode.window.showErrorMessage(
        "LabelSelector is not configured. Please configure it before starting the analyzer.",
        "Select Sources and Targets",
        "Configure LabelSelector",
        "Cancel",
      );

      switch (selection) {
        case "Select Sources and Targets":
          await vscode.commands.executeCommand("konveyor.configureSourcesTargets");
          break;
        case "Configure LabelSelector":
          await vscode.commands.executeCommand("konveyor.configureLabelSelector");
          break;
      }
      return false;
    }

    if (this.getRules().length === 0) {
      const selection = await vscode.window.showWarningMessage(
        "Default rulesets are disabled and no custom rules are defined. Please choose an option to proceed.",
        "Enable Default Rulesets",
        "Configure Custom Rules",
        "Cancel",
      );

      switch (selection) {
        case "Enable Default Rulesets":
          await this.config!.update(
            "useDefaultRulesets",
            true,
            vscode.ConfigurationTarget.Workspace,
          );
          vscode.window.showInformationMessage("Default rulesets have been enabled.");
          break;
        case "Configure Custom Rules":
          await vscode.commands.executeCommand("konveyor.configureCustomRules");
          break;
      }
      return false;
    }

    return true;
  }

  public getAnalyzerPath(): string {
    return path.join(this.extContext!.extensionPath, "assets/bin/kai-analyzer");
  }

  public getAnalyzerArgs(): string[] {
    return [
      "-source-directory",
      vscode.workspace.workspaceFolders![0].uri.fsPath,
      "-rules-directory",
      this.getRules(),
      "-lspServerPath",
      path.join(this.extContext!.extensionPath, "assets/bin/jdtls/bin/jdtls"),
      "-bundles",
      path.join(
        this.extContext!.extensionPath,
        "assets/bin/jdtls/java-analyzer-bundle/java-analyzer-bundle.core/target/java-analyzer-bundle.core-1.0.0-SNAPSHOT.jar",
      ),
    ];
  }

  public getNumWorkers(): number {
    return this.config!.get("workers") as number;
  }

  public getIncidentLimit(): number {
    return this.config!.get("incidentLimit") as number;
  }

  public getContextLines(): number {
    return this.config!.get("contextLines") as number;
  }

  public getCodeSnipLimit(): number {
    return this.config!.get("codeSnipLimit") as number;
  }

  public getRules(): string {
    return path.join(this.extContext!.extensionPath, "assets/rulesets");
    // const useDefaultRulesets = this.config!.get("useDefaultRulesets") as boolean;
    // const customRules = this.config!.get("customRules") as string[];
    // const rules: string[] = [];

    // if (useDefaultRulesets) {
    //   rules.push(path.join(this.extContext!.extensionPath, "assets/rulesets"));
    // }
    // if (customRules.length > 0) {
    //   rules.push(...customRules);
    // }
    // return rules;
  }

  public getLabelSelector(): string {
    return this.config!.get("labelSelector") as string;
  }

  public getJavaConfig(): object {
    return {
      bundles: path.join(
        this.extContext!.extensionPath,
        "assets/bin/jdtls/java-analyzer-bundle/java-analyzer-bundle.core/target/java-analyzer-bundle.core-1.0.0-SNAPSHOT.jar",
      ),
      lspServerPath: path.join(this.extContext!.extensionPath, "assets/bin/jdtls/bin/jdtls"),
    };
  }
}
