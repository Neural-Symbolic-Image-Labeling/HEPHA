import { updateLogs } from "../apis/workspace";

/**
 * @type {import("./logger").Logger}
 */
class Logger {
  constructor() {
    this.initLogger();
    this.initCurrState();
    this.initCurrAction();
  }

  initLogger() {
    /** @type {import("./logger").Log} */
    this.log = {
      collectionName: null,
      workspaceName: null,
      state: null,
    };
    this.initCurrAction();
    this.initCurrState();
  }

  initCurrState(startAccuracy = null, startRule = null) {
    /** @type {import("./logger").State}*/
    this.currState = {
      createdAt: new Date().toISOString(),
      finishedAt: null,
      startAccuracy: startAccuracy,
      endAccuracy: null,
      startManualRatio: null,
      endManualRatio: null,
      actions: [],
      snapshot: null,
      controls: {
        searchCount: 0,
        filterCount: 0,
      },
      rules: {
        additionCount: 0, // duplicate with additions.length, consider remove this field.
        deletionCount: 0,
        banCount: 0,
        lockCount: 0,
        previewCount: 0,
        additions: [],
        endRule: null,
        startRule: startRule,
      },
    };
  }

  initCurrAction() {
    /** @type {import("./logger").Action} */
    this.currAction = {
      imageId: null,

      endLabel: null,
      startLabel: null,

      endType: null,
      startType: null,
    };
  }

  recordCurrState() {
    this.currState.finishedAt = new Date().toISOString();
    this.log.state = this.currState;
    this.initCurrState();
  }

  recordCurrAction() {
    this.currState.actions.push(this.currAction);
    this.initCurrAction();
  }

  syncLogs(callbackOnSuccess = (res) => {}, callbackOnFail = (err) => {}) {
    updateLogs(this.log.collectionName, this.log.workspaceName, this.log.state)
      .then((res) => {
        this.log.state = null;
        callbackOnSuccess(res);
      })
      .catch((err) => {
        console.log(err);
        callbackOnFail(err);
      });
  }
}

export const logger = new Logger();
