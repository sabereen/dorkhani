import type { AdminNotification } from './adminNotification'
import { EitaaAdminNotification } from './eitaa'
import { NoopAdminNotification } from './noop'

export function getNotificationProvider(): AdminNotification {
	if (EitaaAdminNotification.enabled()) {
		return new EitaaAdminNotification()
	}
	return new NoopAdminNotification()
}
