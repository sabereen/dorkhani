/* eslint-disable @typescript-eslint/no-explicit-any */

import 'core-js/modules/es.global-this'
import 'core-js/modules/es.object.from-entries'
import 'core-js/modules/es.promise.all-settled'

import 'core-js/modules/web.queue-microtask'

window.AbortController ||= class {
	abort() {}
} as any
