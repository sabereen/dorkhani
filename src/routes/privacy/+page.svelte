<script lang="ts">
	import LegalPage from '$lib/components/LegalPage.svelte'
	import { page } from '$app/state'
	import * as m from '$lib/paraglide/messages.js'
</script>

<LegalPage
	title={m.privacy_title()}
	eyebrow={m.privacy_eyebrow()}
	summary={m.privacy_summary({ name: page.data.branding.name })}
>
	<section class="ui-legal-section" aria-labelledby="privacy-purpose">
		<span class="ui-legal-section-number" aria-hidden="true">۱</span>
		<div>
			<h2 id="privacy-purpose">{m.privacy_purpose_title()}</h2>
			<p>{m.privacy_purpose_text()}</p>
		</div>
	</section>

	<section class="ui-legal-section" aria-labelledby="privacy-collected-data">
		<span class="ui-legal-section-number" aria-hidden="true">۲</span>
		<div>
			<h2 id="privacy-collected-data">{m.privacy_collected_title()}</h2>
			<ul>
				<li>{m.privacy_collected_account()}</li>
				<li>{m.privacy_collected_khatm()}</li>
				<li>{m.privacy_collected_notifications()}</li>
				<li>{m.privacy_collected_technical()}</li>
			</ul>
		</div>
	</section>

	<section class="ui-legal-section" aria-labelledby="privacy-use">
		<span class="ui-legal-section-number" aria-hidden="true">۳</span>
		<div>
			<h2 id="privacy-use">{m.privacy_use_title()}</h2>
			<p>{m.privacy_use_text()}</p>
		</div>
	</section>

	<section class="ui-legal-section" aria-labelledby="privacy-sharing">
		<span class="ui-legal-section-number" aria-hidden="true">۴</span>
		<div>
			<h2 id="privacy-sharing">{m.privacy_sharing_title()}</h2>
			<p>{m.privacy_sharing_text()}</p>
		</div>
	</section>

	<section class="ui-legal-section" aria-labelledby="privacy-control">
		<span class="ui-legal-section-number" aria-hidden="true">۵</span>
		<div>
			<h2 id="privacy-control">{m.privacy_control_title()}</h2>
			<p>{m.privacy_control_text()}</p>
		</div>
	</section>
</LegalPage>
