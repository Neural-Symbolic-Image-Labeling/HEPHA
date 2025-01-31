import * as Blockly from "blockly";
import { logger } from "../../../utils/logger";

const registerLock = () => {
  /** @type {Blockly.ContextMenuRegistry.RegistryItem} */
  const lockOption = {
    displayText: (scope) => {
      const { block } = scope;
      if (
        block.getFieldValue("LOCKED") === true ||
        block.getFieldValue("LOCKED") === "TRUE"
      ) {
        return "Unlock";
      }
      return "Lock";
    },
    /** @param {Blockly.ContextMenuRegistry.Scope} scope*/
    preconditionFn: (scope) => {
      const { block } = scope;
      const ban_state = block.getFieldValue("BANNED");
      if (
        block.type === "clause" &&
        (
          ban_state === "FALSE" ||
          ban_state === false
        )
      ) {
        return "enabled";
      }
      return "hidden";
    },
    /** @param {Blockly.ContextMenuRegistry.Scope} scope*/
    callback: (scope) => {
      if (!scope?.block) return;

      const { block } = scope;
      if (
        block.getFieldValue("LOCKED") === true ||
        block.getFieldValue("LOCKED") === "TRUE"
      ) {
        block.setFieldValue("FALSE", "LOCKED");
      } else {
        block.setFieldValue("TRUE", "LOCKED");
      }
      logger.currState.rules.lockCount += 1;
    },
    scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
    id: "lock",
    weight: 0,
  };
  Blockly.ContextMenuRegistry.registry.register(lockOption);
};

const registerBan = () => {
  /** @type {Blockly.ContextMenuRegistry.RegistryItem} */
  const banOption = {
    displayText: (scope) => {
      const { block } = scope;
      if (
        block.getFieldValue("BANNED") === true ||
        block.getFieldValue("BANNED") === "TRUE"
      ) {
        return "Unban";
      }
      return "Ban";
    },
    /** @param {Blockly.ContextMenuRegistry.Scope} scope*/
    preconditionFn: (scope) => {
      const { block } = scope;
      if (
        block.type === "clause"
      ) {
        return "enabled";
      }
      return "hidden";
    },
    /** @param {Blockly.ContextMenuRegistry.Scope} scope*/
    callback: (scope) => {
      if (!scope?.block) return;

      const { block } = scope;
      if (
        block.getFieldValue("BANNED") === true ||
        block.getFieldValue("BANNED") === "TRUE"
      ) {
        block.setFieldValue("FALSE", "BANNED");
        for (let des of block.getDescendants()) {
          des.setDisabledReason(false, "Block Banned");
          des.setDeletable(true);
        }
      } else {
        block.setFieldValue("TRUE", "BANNED");
        for (let des of block.getDescendants()) {
          des.setDisabledReason(true, "Block Banned");
          des.setDeletable(false);
        }
      }
      logger.currState.rules.banCount += 1;
    },
    scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
    id: "ban",
    weight: 1,
  };
  Blockly.ContextMenuRegistry.registry.register(banOption);
};

// delete a block if selected, or delete all blocks in a stack if a block in the stack is selected
const registerDrop = () => {
  const deleteOption = {
    displayText(scope) {
      const block = scope.block;
      // Count the number of blocks that are nested in this block.
      let descendantCount = block.getDescendants(false).length;
      const nextBlock = block.getNextBlock();
      if (nextBlock) {
        // Blocks in the current stack would survive this block's deletion.
        descendantCount -= nextBlock.getDescendants(false).length;
      }
      return descendantCount === 1
        ? 'Remove'
        : `Remove (${descendantCount} blocks)`;
    },
    preconditionFn(scope) {
      if (scope.block.isDeletable()) {
        return 'enabled';
      }
      return 'hidden';
    },
    callback(scope) {
      if (scope.block) {
        scope.block.checkAndDelete();
      }
    },
    scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
    id: 'drop',
    weight: 6,
  };
  Blockly.ContextMenuRegistry.registry.register(deleteOption);
}

export const registerContextMenuItems = () => {
  registerLock();
  registerBan();
  registerDrop();
};
