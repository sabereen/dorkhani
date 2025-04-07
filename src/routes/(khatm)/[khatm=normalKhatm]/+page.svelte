<script lang="ts">
	import { useKathmContext } from '../khatm-context.svelte'
	import GridLayout from './grid/grid-layout.svelte'
	import ListLayout from './list/list-layout.svelte'
	import WizardLayout from './wizard-layout.svelte'

	const khatmContext = useKathmContext()
	const khatm = $derived(khatmContext.khatm)
	const parts = $derived(khatmContext.parts)
	const layout = $derived(khatmContext.layout)

	const SelectPart = $derived(
		{
			wizard: WizardLayout,
			grid: GridLayout,
			list: ListLayout,
		}[layout],
	)
</script>

<SelectPart {khatm} {parts} onFinished={() => khatm.refresh()} />
