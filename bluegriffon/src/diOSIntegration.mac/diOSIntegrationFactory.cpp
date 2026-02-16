/* -*- Mode: C++; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
#define MOZILLA_INTERNAL_API 1

#include "mozilla/ModuleUtils.h"
#include "nsIClassInfoImpl.h"
#include "nsIServiceManager.h"
#include "diOSIntegration.h"
#include "diOSIntegrationCIID.h"
#include "nsString.h"

namespace mozilla
{
// Factory defined in mozilla::, defines mozilla::diOSIntegrationConstructor
NS_GENERIC_FACTORY_CONSTRUCTOR(diOSIntegration)
}

NS_DEFINE_NAMED_CID(DI_OS_INTEGRATION_CID);
