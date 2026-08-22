import type { Action } from 'svelte/action'
import { formatNumber } from '$lib/i18n/format'
import * as m from '$lib/paraglide/messages.js'

type ValidatableControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

const ignoredInputTypes = new Set(['button', 'hidden', 'image', 'reset', 'submit'])

function isValidatableControl(element: Element): element is ValidatableControl {
	if (element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) return true
	return element instanceof HTMLInputElement && !ignoredInputTypes.has(element.type)
}

function hasValidationRule(control: ValidatableControl) {
	if (control.dataset.uiValidate !== undefined) return true
	if (control.required) return true
	if (control instanceof HTMLTextAreaElement)
		return control.minLength >= 0 || control.maxLength >= 0
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
	if (control.type === 'password' || control.type === 'checkbox' || control.type === 'radio')
		return false
	return control.value.trim().length === 0
}

function isControlValid(control: ValidatableControl) {
	return !isBlankRequired(control) && control.validity.valid
}

function validationMessage(control: ValidatableControl) {
	const customMessage = control.dataset.validationMessage
	if (customMessage) return customMessage

	const { validity } = control
	if (isBlankRequired(control)) return m.validation_required()
	if (validity.valueMissing) return m.validation_required()
	if (validity.typeMismatch && control instanceof HTMLInputElement && control.type === 'email') {
		return m.validation_email()
	}
	if (validity.typeMismatch && control instanceof HTMLInputElement && control.type === 'url') {
		return m.validation_url()
	}
	if (validity.tooShort)
		return m.validation_min_length({ count: formatNumber((control as HTMLInputElement).minLength) })
	if (validity.tooLong)
		return m.validation_max_length({ count: formatNumber((control as HTMLInputElement).maxLength) })
	if (validity.rangeUnderflow && control instanceof HTMLInputElement) {
		return m.validation_min_value({ value: formatNumber(Number(control.min)) })
	}
	if (validity.rangeOverflow && control instanceof HTMLInputElement) {
		return m.validation_max_value({ value: formatNumber(Number(control.max)) })
	}
	if (validity.stepMismatch) return m.validation_step()
	if (validity.badInput) return m.validation_bad_input()
	if (validity.patternMismatch) return m.validation_pattern()
	return m.validation_generic()
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
	const errorElements = new Map<
		ValidatableControl,
		{ root: HTMLElement; content: HTMLElement }
	>()
	const touched = new Set<ValidatableControl>()
	let submitted = false

	controls.forEach((control, index) => {
		const error = document.createElement('span')
		const errorContent = document.createElement('span')
		error.id = errorId(control, index)
		error.className = 'ui-field-error'
		errorContent.className = 'ui-field-error-content'
		error.setAttribute('aria-live', 'polite')
		error.setAttribute('aria-atomic', 'true')
		error.append(errorContent)

		const describedBy = control.getAttribute('aria-describedby')
		control.setAttribute('aria-describedby', [describedBy, error.id].filter(Boolean).join(' '))

		const host = control.closest('[data-ui-validation-host]') || control
		host.insertAdjacentElement('afterend', error)
		errorElements.set(control, { root: error, content: errorContent })
	})

	function render(control: ValidatableControl, force = false) {
		const error = errorElements.get(control)
		if (!error) return isControlValid(control)

		const valid = isControlValid(control)
		const showError = !valid && (force || submitted || touched.has(control))
		error.content.textContent = showError ? validationMessage(control) : ''
		error.root.dataset.visible = String(showError)
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
					.filter((id) => id && id !== error.root.id)
					.join(' ')
				if (describedBy) control.setAttribute('aria-describedby', describedBy)
				else control.removeAttribute('aria-describedby')
				control.removeAttribute('aria-invalid')
				error.root.remove()
			}
		},
	}
}
