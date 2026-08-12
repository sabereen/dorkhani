import type { Action } from 'svelte/action'

type ValidatableControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

const ignoredInputTypes = new Set(['button', 'hidden', 'image', 'reset', 'submit'])

function isValidatableControl(element: Element): element is ValidatableControl {
	if (element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) return true
	return element instanceof HTMLInputElement && !ignoredInputTypes.has(element.type)
}

function hasValidationRule(control: ValidatableControl) {
	if (control.dataset.uiValidate !== undefined) return true
	if (control.required) return true
	if (control instanceof HTMLTextAreaElement) return control.minLength >= 0 || control.maxLength >= 0
	if (control instanceof HTMLSelectElement) return false
	return (
		control.type === 'email' ||
		control.type === 'url' ||
		control.type === 'number' ||
		control.type === 'date' ||
		control.type === 'time' ||
		control.type === 'datetime-local' ||
		control.minLength >= 0 ||
		control.maxLength >= 0 ||
		Boolean(control.pattern)
	)
}

function isBlankRequired(control: ValidatableControl) {
	if (!control.required || control instanceof HTMLSelectElement) return false
	if (control instanceof HTMLTextAreaElement) return control.value.trim().length === 0
	if (control.type === 'password' || control.type === 'checkbox' || control.type === 'radio') return false
	return control.value.trim().length === 0
}

function isControlValid(control: ValidatableControl) {
	return !isBlankRequired(control) && control.validity.valid
}

function validationMessage(control: ValidatableControl) {
	const customMessage = control.dataset.validationMessage
	if (customMessage) return customMessage

	const { validity } = control
	if (isBlankRequired(control)) return 'لطفاً این فیلد را تکمیل کنید.'
	if (validity.valueMissing) return 'لطفاً این فیلد را تکمیل کنید.'
	if (validity.typeMismatch && control instanceof HTMLInputElement && control.type === 'email') {
		return 'یک نشانی ایمیل معتبر وارد کنید.'
	}
	if (validity.typeMismatch && control instanceof HTMLInputElement && control.type === 'url') {
		return 'یک نشانی اینترنتی معتبر وارد کنید.'
	}
	if (validity.tooShort) return `حداقل ${(control as HTMLInputElement).minLength?.toLocaleString('fa-IR') || ''} نویسه وارد کنید.`
	if (validity.tooLong) return `حداکثر ${(control as HTMLInputElement).maxLength?.toLocaleString('fa-IR') || ''} نویسه مجاز است.`
	if (validity.rangeUnderflow && control instanceof HTMLInputElement) {
		return `مقدار باید دست‌کم ${Number(control.min).toLocaleString('fa-IR')} باشد.`
	}
	if (validity.rangeOverflow && control instanceof HTMLInputElement) {
		return `مقدار باید حداکثر ${Number(control.max).toLocaleString('fa-IR')} باشد.`
	}
	if (validity.stepMismatch) return 'یک مقدار مجاز وارد کنید.'
	if (validity.badInput) return 'مقدار واردشده معتبر نیست.'
	if (validity.patternMismatch) return 'قالب مقدار واردشده معتبر نیست.'
	return 'مقدار این فیلد را بررسی کنید.'
}

function errorId(control: ValidatableControl, index: number) {
	return `${control.id || control.name || 'field'}-error-${index}`
}

export const validateForm: Action<HTMLFormElement> = (form) => {
	form.noValidate = true
	form.dataset.uiValidation = 'true'

	const controls = Array.from(form.elements).filter(
		(element): element is ValidatableControl =>
			element instanceof Element && isValidatableControl(element) && hasValidationRule(element),
	)
	const errorElements = new Map<ValidatableControl, HTMLElement>()
	const touched = new Set<ValidatableControl>()
	let submitted = false

	controls.forEach((control, index) => {
		const error = document.createElement('span')
		error.id = errorId(control, index)
		error.className = 'ui-field-error'
		error.setAttribute('aria-live', 'polite')
		error.setAttribute('aria-atomic', 'true')

		const describedBy = control.getAttribute('aria-describedby')
		control.setAttribute('aria-describedby', [describedBy, error.id].filter(Boolean).join(' '))

		const host = control.closest('[data-ui-validation-host]') || control
		host.insertAdjacentElement('afterend', error)
		errorElements.set(control, error)
	})

	function render(control: ValidatableControl, force = false) {
		const error = errorElements.get(control)
		if (!error) return isControlValid(control)

		const valid = isControlValid(control)
		const showError = !valid && (force || submitted || touched.has(control))
		error.textContent = showError ? validationMessage(control) : ''
		error.dataset.visible = String(showError)
		control.setAttribute('aria-invalid', String(showError))
		return valid
	}

	function handleSubmit(event: SubmitEvent) {
		submitted = true
		let firstInvalid: ValidatableControl | undefined
		for (const control of controls) {
			if (!render(control, true) && !firstInvalid && !control.disabled) firstInvalid = control
		}

		if (!firstInvalid) return
		event.preventDefault()
		event.stopImmediatePropagation()
		firstInvalid.focus()
	}

	function handleInput(event: Event) {
		if (isValidatableControl(event.target as Element)) render(event.target as ValidatableControl)
	}

	function handleChange(event: Event) {
		handleInput(event)
		window.setTimeout(() => {
			for (const control of controls) render(control)
		}, 0)
	}

	function handleBlur(event: FocusEvent) {
		if (!isValidatableControl(event.target as Element)) return
		const control = event.target as ValidatableControl
		touched.add(control)
		render(control)
	}

	function handleInvalid(event: Event) {
		event.preventDefault()
	}

	form.addEventListener('submit', handleSubmit, true)
	form.addEventListener('input', handleInput)
	form.addEventListener('change', handleChange)
	form.addEventListener('focusout', handleBlur)
	form.addEventListener('invalid', handleInvalid, true)

	return {
		destroy() {
			form.removeEventListener('submit', handleSubmit, true)
			form.removeEventListener('input', handleInput)
			form.removeEventListener('change', handleChange)
			form.removeEventListener('focusout', handleBlur)
			form.removeEventListener('invalid', handleInvalid, true)
			for (const [control, error] of errorElements) {
				const describedBy = (control.getAttribute('aria-describedby') || '')
					.split(' ')
					.filter((id) => id && id !== error.id)
					.join(' ')
				if (describedBy) control.setAttribute('aria-describedby', describedBy)
				else control.removeAttribute('aria-describedby')
				control.removeAttribute('aria-invalid')
				error.remove()
			}
		}
	}
}
