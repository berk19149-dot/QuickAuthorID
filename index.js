(function () {
  "use strict";

  const before = vendetta.patcher.before;
  const after = vendetta.patcher.after;
  const findByProps = vendetta.metro.findByProps;
  const findInReactTree = vendetta.utils.findInReactTree;
  const React = vendetta.metro.common.React;
  const clipboard = vendetta.metro.common.clipboard;
  const getAssetIDByName = vendetta.ui.assets.getAssetIDByName;
  const showToast = vendetta.ui.toasts.showToast;

  const ActionSheet = findByProps("openLazy", "hideActionSheet");
  const ActionSheetRow = findByProps("ActionSheetRow").ActionSheetRow;
  const CopyIcon = getAssetIDByName("CopyIcon");

  const unpatch = before("openLazy", ActionSheet, ([component, key, props]) => {
    const message = props && props.message;
    if (key !== "MessageLongPressActionSheet" || !message) return;

    component.then((instance) => {
      const unpatchSheet = after("default", instance, (_, sheet) => {
        React.useEffect(() => () => unpatchSheet(), []);

        const rows = findInReactTree(
          sheet,
          (node) => node && node.some && node.some(
            (child) => child && child.type &&
              (child.type.name === "ButtonRow" || child.type.name === "ActionSheetRow")
          )
        );
        if (!rows) return;

        rows.unshift(
          React.createElement(ActionSheetRow, {
            key: "quick-author-id-copy",
            label: "Copy Author ID",
            icon: React.createElement(ActionSheetRow.Icon, { source: CopyIcon }),
            onPress: () => {
              const authorId = message.author && message.author.id || message.authorId || message.author_id;
              if (typeof authorId !== "string" || !authorId.length) {
                showToast("Could not find the author's ID", CopyIcon);
                return;
              }

              clipboard.setString(authorId);
              showToast("Copied Author ID to clipboard", CopyIcon);
            },
          })
        );
      });
    });
  });

  return {
    onUnload: () => unpatch(),
  };
})()
