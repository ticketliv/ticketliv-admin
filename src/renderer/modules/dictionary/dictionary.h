#ifndef THIRD_PARTY_BLINK_RENDERER_MODULES_DICTIONARY_DICTIONARY_H_
#define THIRD_PARTY_BLINK_RENDERER_MODULES_DICTIONARY_DICTIONARY_H_

#include "third_party/blink/renderer/core/dom/element.h"
#include "third_party/blink/renderer/platform/bindings/script_wrappable.h"
#include "third_party/blink/renderer/platform/heap/garbage_collected.h"
#include "third_party/blink/renderer/platform/wtf/text/wtf_string.h"

namespace blink {

class LocalFrame;

class Dictionary : public ScriptWrappable, public GarbageCollected<Dictionary> {
  DEFINE_WRAPPERTYPEINFO();

 public:
  Dictionary();
  ~Dictionary() override;

  Element* inputElement() const { return input_element_; }
  void setInputElement(Element* element) { input_element_ = element; }

  void insertText(const String& text);
  void deleteBackward();
  void deleteForward();
  void moveCursorForward();
  void moveCursorBackward();

  void Trace(Visitor*) const override;

 private:
  LocalFrame* GetFrame() const;
  Member<Element> input_element_;
};

}  // namespace blink

#endif  // THIRD_PARTY_BLINK_RENDERER_MODULES_DICTIONARY_DICTIONARY_H_
