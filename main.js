import { DocHandle, Repo, isValidAutomergeUrl } from "@automerge/automerge-repo"
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb"
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket"
import { BroadcastChannelNetworkAdapter } from "@automerge/automerge-repo-network-broadcastchannel"
import { next as am } from "@automerge/automerge"
import { syncPlugin, basicSchemaAdapter, pmDocFromSpans } from "@automerge/prosemirror"
import { EditorState, Transaction } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import { exampleSetup } from "prosemirror-example-setup"
import "prosemirror-example-setup/style/style.css"
import "prosemirror-menu/style/menu.css"
import "prosemirror-view/style/prosemirror.css"
const repo = new Repo({
  storage: new IndexedDBStorageAdapter("automerge"),
  network: [
    new BroadcastChannelNetworkAdapter(),
    new BrowserWebSocketClientAdapter("wss://amsync.dokku01.dabreese00.net"),
  ],
})

// Add the repo to the global window object so it can be accessed in the browser console
// This is useful for debugging and testing purposes.
window.repo = repo;

// Get the document ID from the URL fragment if it's there. Otherwise, create
// a new document and update the URL fragment to match.
const docUrl = window.location.hash.slice(1)
let handle;
if (docUrl && isValidAutomergeUrl(docUrl)) {
  handle = await repo.find(docUrl)
} else {
  handle = repo.create({ text: "" })
  window.location.hash = handle.url
}
// Wait for the handle to be available
// await handle.whenReady()

const adapter = basicSchemaAdapter

const view = new EditorView(document.querySelector("#app"), {
  state: EditorState.create({
    doc: pmDocFromSpans(adapter, am.spans(handle.doc(), ["text"])),
    plugins: [
      ...exampleSetup({ schema: adapter.schema }),
      syncPlugin({ adapter, handle, path: ["text"] }),
    ],
  }),
  dispatchTransaction: (tx) => {
    view.updateState(view.state.apply(tx))
  },
})
