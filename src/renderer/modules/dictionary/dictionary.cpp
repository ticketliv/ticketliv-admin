#include "third_party/blink/renderer/modules/dictionary/dictionary.h"

#include "third_party/blink/renderer/core/dom/document.h"
#include "third_party/blink/renderer/core/editing/editor.h"
#include "third_party/blink/renderer/core/frame/local_frame.h"

namespace blink {

Dictionary::Dictionary() : input_element_(nullptr) {}

Dictionary::~Dictionary() = default;

LocalFrame* Dictionary::GetFrame() const {
  if (!input_element_)
    return nullptr;
  return input_element_->GetDocument().GetFrame();
}

void Dictionary::insertText(const String& text) {
  LocalFrame* frame = GetFrame();
  if (!frame)
    return;
  frame->GetEditor().InsertText(text, nullptr);
}

void Dictionary::deleteBackward() {
  LocalFrame* frame = GetFrame();
  if (!frame)
    return;
  frame->GetEditor().Command("DeleteBackward").Execute();
}

void Dictionary::deleteForward() {
  LocalFrame* frame = GetFrame();
  if (!frame)
    return;
  frame->GetEditor().Command("DeleteForward").Execute();
}

void Dictionary::moveCursorForward() {
  LocalFrame* frame = GetFrame();
  if (!frame)
    return;
  frame->GetEditor().Command("Forward").Execute();
}

void Dictionary::moveCursorBackward() {
  LocalFrame* frame = GetFrame();
  if (!frame)
    return;
  frame->GetEditor().Command("Backward").Execute();
}

void Dictionary::Trace(Visitor* visitor) const {
  visitor->Trace(input_element_);
  ScriptWrappable::Trace(visitor);
}

}  // namespace blink
