export interface Action {
  imageId: string;
  startType: "auto" | "manual" | "unlabeled" | "conflict";
  startLabel: string[];
  endType: "auto" | "manual" | "unlabeled" | "conflict";
  endLabel: string[];
}

export interface State {
  createdAt: string;
  finishedAt: string;
  startAccuracy: number | null;
  endAccuracy: number | null;
  startManualRatio: number | null;
  endManualRatio: number | null;
  controls: {
    searchCount: number;
    filterCount: number;
  };
  actions: Action[];
  snapshot: any;
  rules: {
    previewCount: number;
    startRule: any; // general format
    endRule: any; // general format
    deletionCount: number;
    additionCount: number;
    lockCount: number;
    banCount: number;
    additions: string[];
  };
}

export interface Log {
  workspaceName: string?;
  collectionName: string?;
  state: State?;
}

export declare class Logger {
  public log: Log;
  public currState: State;
  public currAction: Action;

  public initLogger: () => void;
  private initCurrState: () => void;
  private initCurrAction: () => void;
  public recordCurrState: () => void;
  public recordCurrAction: () => void;
  public syncLogs: (
    callbackOnSuccess: (res: any) => void,
    callbackOnFail: (err: any) => void,
  ) => void;
}

export declare const logger: Logger;
