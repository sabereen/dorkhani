<script lang="ts">
	import LegalPage from '$lib/components/LegalPage.svelte'
	import { page } from '$app/state'
	import * as m from '$lib/paraglide/messages.js'
</script>

<LegalPage
	title={m.terms_title()}
	eyebrow={m.terms_eyebrow()}
	summary={m.terms_summary({ name: page.data.branding.name })}
>
	<section class="ui-legal-section" aria-labelledby="terms-acceptance">
		<span class="ui-legal-section-number" aria-hidden="true">۱</span>
		<div>
			<h2 id="terms-acceptance">{m.terms_acceptance_title()}</h2>
			<p>{m.terms_acceptance_text()}</p>
		</div>
	</section>

	<section class="ui-legal-section" aria-labelledby="terms-use">
		<span class="ui-legal-section-number" aria-hidden="true">۲</span>
		<div>
			<h2 id="terms-use">{m.terms_use_title()}</h2>
			<ul>
				<li>{m.terms_use_account()}</li>
				<li>{m.terms_use_respect()}</li>
				<li>{m.terms_use_abuse()}</li>
			</ul>
		</div>
	</section>

	<section class="ui-legal-section" aria-labelledby="terms-khatms">
		<span class="ui-legal-section-number" aria-hidden="true">۳</span>
		<div>
			<h2 id="terms-khatms">{m.terms_khatms_title()}</h2>
			<p>{m.terms_khatms_text()}</p>
		</div>
	</section>

	<section class="ui-legal-section" aria-labelledby="terms-availability">
		<span class="ui-legal-section-number" aria-hidden="true">۴</span>
		<div>
			<h2 id="terms-availability">{m.terms_availability_title()}</h2>
			<p>{m.terms_availability_text()}</p>
		</div>
	</section>

	<section class="ui-legal-section" aria-labelledby="terms-changes">
		<span class="ui-legal-section-number" aria-hidden="true">۵</span>
		<div>
			<h2 id="terms-changes">{m.terms_changes_title()}</h2>
			<p>{m.terms_changes_text()}</p>
		</div>
	</section>
</LegalPage>
