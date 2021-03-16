#pragma once

#include <stdio.h>
#include "Scheduler.h"
#import <ABI41_0_0ReactCommon/CallInvoker.h>
#import <ABI41_0_0React/ABI41_0_0RCTUIManager.h>

namespace reanimated
{

using namespace facebook;
using namespace react;

class REAIOSScheduler : public Scheduler {
  public:
  REAIOSScheduler(std::shared_ptr<CallInvoker> jsInvoker);
  void scheduleOnUI(std::function<void()> job) override;
  virtual ~REAIOSScheduler();
};

} // namespace reanimated
