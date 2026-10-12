# Classic Chat: verified source paths and adaptation

This reference was checked against the complete VS Code source at revision
`114d61e889475758fd1c3b3fcbdd04e9717940c4`. It targets the desktop workbench's
normal **Chat view**, with `workbench.experimental.modernUI: false`. It does not
use the separate Agents window, Quick Chat, inline Chat, or minimal/compact
hosts as its baseline. **Source facts** below follow the host, configuration,
selectors, and shared theme-variable injection. **Adaptation guidance** describes
how to apply those facts to another product.

## Establish the Classic baseline

- Explicitly disable Modern UI. Its registered default is **true at this
  revision**; “the default UI” is therefore not an adequate Classic identifier.
  The contribution gates the Modern classes and layout metrics on this setting.
  See [setting registration][modern-setting] and [class/metric gate][modern-gate].
- The normal view creates `.chat-controls-container`, constructs `ChatWidget`,
  and renders it there; `ChatWidget` creates `.interactive-session`. This makes
  the request selector excluding `.chat-widget > .interactive-session` relevant
  to this host. See [view construction][view-host] and [session DOM][session-dom].
- Shared size tokens are available in Classic: the workbench theme service
  generates CSS for `.monaco-workbench`, including every registered size.
  `cornerRadius.medium = 6px`, `small = 4px`, `large = 8px`, compact Codicons
  `= 12px`, and stroke `= 1px` are registered defaults. Use these only where
  an active component consumes them. See [theme service][theme-service],
  [size injection][size-injection], and [size definitions][sizes].
- A concrete Classic/Modern distinction: the normal Chat view title is uppercase,
  `11px`, weight `700`, line height `16px`. The Modern-only selector changes its
  casing and size to `12px`; that override does not apply here. See
  [Classic title][classic-title] and [excluded Modern override][modern-title].

These are source-verified defaults and branches, not measurements from a running
build. For an exact replica, also record platform, theme, font settings, Chat
mode, progress settings, viewport, and zoom before comparing screenshots.

## Reply body

**Source facts.** `chat.fontSize` defaults to **13px** and `chat.fontFamily` to
`default`. The layout service observes those settings; the widget applies the
font size to its session container and exposes the family as a CSS variable.
See [settings][body-settings], [layout service][body-layout], and
[widget application][body-application]. The message Markdown selector uses
`--vscode-chat-font-size-body-m`, a Chat font-family variable, and a `1.5em` line
height. In the session's local scale, `body-m` is `1em`; the source's comments
illustrate sizes for the default 13px base, not a fixed size for every configuration.
The adjacent paragraph selector supplies a 16 px bottom margin for its specified
message-content paths. These are not toolbar metrics. See [body CSS][body-css]
and [session scale][scale-css].

Keep the other font paths separate:

- The composer editor explicitly uses `13px` with a `20px` line height; it does
  not take these from the reply-body preference. See [editor options][input-font]
  and [line-height constant][input-line-height].
- Result code editors use `chat.editor.fontSize` (default `12px` on macOS,
  `14px` elsewhere), `chat.editor.fontFamily` (`default` resolves to
  `editor.fontFamily`), and their own line height. A configured zero requests
  `1.4 × font size` before the editor resolves its layout. Word wrap defaults
  to `off`. See [code settings][code-settings], the
  [line-height multiplier][code-options], and [option resolution][code-option-resolution].

**Adaptation guidance.** Map readable prose separately from UI labels and editor
text. Retain the product's body preference, semantic Markdown, and content
spacing unless an exact target has been established. Test nested lists, long
paths, tables, inline code, and wide fenced blocks. A nearby action row does not
justify setting the reply body to 11 px.

## User messages and theme roles

**Source facts.** Under
`.interactive-session:not(.chat-widget > .interactive-session)`, the request
Markdown rule uses `chat.requestBubbleBackground`, `8px 12px` padding,
`max-width: 90%`, `width: fit-content`, and `margin-left: auto`. The corner radius
is the shared **6px** medium radius. This rule belongs to that host selector;
it is not a rule for every request renderer. See [request variant][request-css].

`chat.requestBackground`, `chat.requestBubbleBackground`, `chat.requestBorder`,
and `chat.requestCodeBorder` are separately registered roles. A role's existence
does not prove that every request surface consumes it. See [request roles][request-colors]
and [bubble/code roles][bubble-colors].

**Adaptation guidance.** Preserve the product's user-message alignment, editing,
attachments, and submitted state until its renderer has a reliable match. Keep
request and reply styling separate. Use the role consumed by the matched variant;
do not substitute `requestBackground` for `requestBubbleBackground` simply
because both names concern requests.

## Reasoning disclosures

**Source facts.** Persistent progress is **independent of Modern UI**.
`chat.experimental.persistentProgress` defaults to `draw`, and
`chat.experimental.persistentProgressVerbosity` defaults to `compact`.
Experiments may override defaults; explicit settings take precedence. The normal
renderer enables persistent progress when the render style is not `minimal` and
the resolved animation is not `off`. See [progress configuration][progress-config]
and [renderer gate][progress-gate]. Record this setting when comparing Classic
screenshots; an older-looking progress presentation is not proof of Classic.

With persistent progress, the thinking part chooses `CollapsedPreview`; verbose
tool chains start expanded. Otherwise the configured thinking presentation
applies. The initialization starts `Collapsed` closed and starts
`CollapsedPreview` open only while the thinking part and response are incomplete. Read-only
and phone contexts select collapsed-preview mode. See [mode selection][thinking-mode]
and [initial expansion][thinking-init]. The shared disclosure implementation
wires a collapse button to expansion state and makes collapsed animated content
inert. See [disclosure control][disclosure].

The persistent-progress CSS defines `16px` item gaps and nested indentation,
`6px` nested gaps, and `12px` glyphs. It positions the glyph using
`(body-font-size × 1.5 − glyph-size) / 2`; the chain guide uses a `1px`
`chat.requestBorder` stroke. These are tool/reasoning geometry, not Explorer
tree-indent metrics. See [persistent dimensions][progress-dimensions] and
[icon/guide rules][progress-guides].

**Adaptation guidance.** Preserve the host's own expansion policy and supplied
reasoning summary. Keep running/completed status separate from open/closed state.
Do not replace a product policy with a supposed universal VS Code rule that
thinking always stays open, always closes on completion, or always preserves the
same expansion state. Verify click/keyboard toggling, focus, nested backgrounds,
and indentation guides in the actual product.

## Tool calls and results

**Source facts.** The tool model has distinct streaming, executing,
waiting-for-confirmation, and cancelled paths. The renderer chooses specialized
parts for streaming, confirmation, authentication, and post-execution approval;
result input/output can separately carry `isError`. Thus “complete” is not a
sufficient rendering description. See [tool model][tool-model], [part selection][tool-parts],
and [result error handling][tool-errors].

**Adaptation guidance.** Map only the states the product actually supports.
Separate a concise summary from long arguments/output and preserve its existing
approval and recovery flows. Do not impose a single header/body geometry on all
tool kinds or introduce new approval behavior merely to imitate this source.
Stable status slots and visible nesting are review goals, not source-verified
universal Chat dimensions.

## Message actions and composer controls

**Source facts.** The response footer CSS is scoped to non-loading responses.
It reveals the toolbar for the most recent response, `focus-within`, or group
hover; system-notification responses have an explicit hiding rule. This is more
specific than “show all message actions on hover.” See [footer rules][footer-css].
The legacy footer declares a `22px` height and `6px` top padding. The persistent
variant instead declares `max(22px, body-font-size × 1.5)` height and `16px`
top padding. These are CSS heights plus padding, not total outer measurements.

The ordinary composer container uses `input.background`, a `1px input.border`
with transparent fallback, and `0 6px 6px 6px` padding. Its normal corner radius
is `8px`; docked content can override the top corners. Compact and Quick Chat
have separate radius rules. See [composer container][composer-css].

Composer picker controls use a **22px border-box height**, `0 6px` padding,
and `4px` radius. Their icon-only variant is `22 × 22px`; compact glyphs are
`12px`, independently of the text. Primary toolbar action gaps are `4px`,
secondary gaps `2px`. See [control height][control-height] and
[picker/action geometry][input-actions]. The split picker divides its clickable
sections and has its own focus/hover rules. The model split's outer label resets
padding to zero; its inner buttons provide the padding, so do not apply it twice.
The configuration summary uses the `10px` label token. See
[split-picker CSS][picker-css] and [model-specific rules][model-css].

**Adaptation guidance.** Map each message action and composer choice control to
its own variant. Preserve labels, selected values, popup behavior, send/stop,
and keyboard submission. Check that revealed actions do not obscure prose or
move it, and that visually hidden controls do not intercept input. These checks
are host acceptance criteria; the footer CSS alone does not prove hit testing or
keyboard behavior. Auto-growing composer text may retain its existing mechanism.

## Streaming and scrolling

**Source facts.** `ChatMarkdownContentPart` passes `fillInIncompleteTokens` to
the Markdown renderer and has a configuration-gated incremental-rendering path
for active responses. See [stream initialization][stream-init] and [Markdown rendering][markdown-render].
`ChatListWidget._withPersistedAutoScroll` records whether the list was at the
bottom and not held before an update, then reveals the last item conditionally.
The scroll-down button's visibility is based on the actual bottom position.
See [update helper][scroll-update] and [scroll-down state][scroll-state]. These
specific paths are not a full audit of all scroll and focus behavior.
The normal Chat view also supplies `autoScroll: mode => mode !== Ask`.
When input-height changes reflow the list, it scrolls to the end only if the
last item was visible, auto-scroll is not held, and either the last response
is not actively rendering or the mode permits auto-scroll. See
[host options][view-host] and [layout scroll condition][layout-scroll].

**Adaptation guidance.** Preserve the product's streaming lifecycle and partial
output. Test scrolling back during a stream, return-to-latest, text selection,
focused actions, stop, cancellation, and error recovery. Do not claim that DOM
identity, disclosure state, or focus survives every update merely from these
source observations; inspect those states in the running host.

## Markdown blocks versus editor-backed blocks

**Source facts.** VS Code Chat supplies a custom `codeBlockRendererSync` and
uses an editor pool in `renderCodeBlock`; its fenced Markdown can therefore
produce an editor-backed component. A Markdown fence is input syntax, not proof
of a plain `pre > code` implementation. See [renderer hook][markdown-render]
and [editor-pool rendering][editor-pool].

The editor-backed block stylesheet declares an overlay toolbar with
`top: -15px`, CSS `height: 26px`, a 1 px border, and `max-width: 70%`. Its action
items declare **24 × 24 px plus `1px 2px` margins**; 24 px is not their total
horizontal allocation. The radius is `--vscode-cornerRadius-medium`, whose
registered Classic default is **6px** through the injection path above.
The toolbar becomes interactive on hover, focus within, the block's focused class, or an explicit force-visibility class. See
[block and toolbar CSS][block-css]. These are source declarations; inspect the
host's box model and overrides before reporting final outer sizes.

**Adaptation guidance.** Classify the actual rendered component:

- A product's ordinary `pre > code` block retains its Markdown padding, radius,
  overflow, and any locally owned copy action.
- A matched editor-backed block has an editor viewport, focus/selection behavior,
  and its own action container. Apply only that variant's verified metrics.

Do not transfer the editor overlay offset, toolbar height, or action-item sizing
to every highlighted code fence. Do not add an editor dependency solely to imitate
its appearance. See [editor-surfaces.md](editor-surfaces.md#code-blocks) for the
same component boundary.

## Acceptance and remaining gaps

Use the [visual acceptance procedure](application-and-review.md#visual-acceptance)
on the actual product: long prose and user messages, both code implementations
when present, thinking expansion, nested tools, focused message actions, streaming
while scrolled up, and a body-font preference change at a narrow width.

This audit establishes the Classic source paths and registered dimensions above.
It does not establish a running Classic Chat screenshot baseline,
computed outer geometry for every display mode, model-picker popup metrics, or all
completion/cancellation transitions. Preserve uncovered product behavior and mark
those details unverified for an exact-replica task. Passing a skill-format or
link check does not verify these UI facts.

[body-css]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widget/media/chat.css#L860-L875
[scale-css]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widget/media/chat.css#L10-L31
[request-css]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widget/media/chat.css#L4046-L4084
[request-colors]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/common/widget/chatColors.ts#L24-L34
[bubble-colors]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/common/widget/chatColors.ts#L95-L99
[thinking-mode]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatThinkingContentPart.ts#L59-L67
[thinking-init]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatThinkingContentPart.ts#L479-L520
[disclosure]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatCollapsibleContentPart.ts#L133-L167
[tool-model]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/common/model/chatProgressTypes/chatToolInvocation.ts#L113-L146
[tool-parts]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatToolInvocationPart.ts#L375-L413
[tool-errors]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/toolInvocationParts/chatToolInvocationPart.ts#L454-L482
[footer-css]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widget/media/chat.css#L340-L380
[picker-css]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widget/input/media/chatInputPicker.css#L6-L55
[stream-init]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatMarkdownContentPart.ts#L168-L175
[markdown-render]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatMarkdownContentPart.ts#L244-L253
[scroll-update]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widget/chatListWidget.ts#L1292-L1305
[scroll-state]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widget/chatListWidget.ts#L130-L146
[editor-pool]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/chatMarkdownContentPart.ts#L536-L540
[block-css]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/media/codeBlockPart.css#L7-L84

[modern-setting]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/browser/workbench.contribution.ts#L834-L840
[modern-gate]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/modernUI/browser/modernUI.contribution.ts#L154-L200
[view-host]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widgetHosts/viewPane/chatViewPane.ts#L1062-L1111
[session-dom]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widget/chatWidget.ts#L1129-L1138
[theme-service]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/services/themes/browser/workbenchThemeService.ts#L594-L602
[size-injection]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/services/themes/browser/colorThemeCss.ts#L54-L62
[sizes]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/platform/theme/common/sizes/baseSizes.ts#L55-L180
[classic-title]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widgetHosts/viewPane/media/chatViewTitleControl.css#L36-L45
[modern-title]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/modernUI/browser/media/fontRamp.css#L160-L165
[body-settings]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/chat.shared.contribution.ts#L331-L343
[body-layout]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widget/chatLayoutService.ts#L12-L29
[body-application]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widget/chatWidget.ts#L1269-L1279
[input-font]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widget/input/chatInputPart.ts#L3534-L3542
[input-line-height]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widget/input/chatInputPart.ts#L192
[code-settings]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/chat.shared.contribution.ts#L439-L465
[code-options]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widget/chatOptions.ts#L55-L57
[progress-config]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/chatProgressConfiguration.ts#L12-L46
[progress-gate]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widget/chatListRenderer.ts#L2030-L2041
[progress-dimensions]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/media/chatThinkingContent.css#L230-L237
[progress-guides]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widget/chatContentParts/media/chatThinkingContent.css#L35-L100
[composer-css]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widget/media/chat.css#L1211-L1257
[control-height]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widget/media/chat.css#L6-L8
[input-actions]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widget/media/chat.css#L2116-L2194
[model-css]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widget/input/modelPicker/media/modelPicker.css#L19-L108
[layout-scroll]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widget/chatWidget.ts#L4106-L4131
[code-option-resolution]: https://github.com/microsoft/vscode/blob/114d61e889475758fd1c3b3fcbdd04e9717940c4/src/vs/workbench/contrib/chat/browser/widget/chatOptions.ts#L117-L129
