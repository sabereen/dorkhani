<script lang="ts">
	import { base } from '$app/paths'
	import type { Snippet } from 'svelte'
	import Header from '$lib/components/Header.svelte'
	import IconAutoAwesome from '~icons/ic/round-auto-awesome'
	import IconCheck from '~icons/ic/round-check-circle'
	import IconGroups from '~icons/ic/round-groups'
	import IconMenuBook from '~icons/ic/round-menu-book'

	type Props = {
		title: string
		eyebrow: string
		description: string
		children: Snippet
	}

	const { title, eyebrow, description, children }: Props = $props()
</script>

<Header {title} />

<section class="ui-auth-shell">
	<span class="ui-auth-orb ui-auth-orb-one" aria-hidden="true"></span>
	<span class="ui-auth-orb ui-auth-orb-two" aria-hidden="true"></span>

	<aside class="ui-auth-story" aria-label="درباره سامانه ختم جمعی قرآن">
		<a class="ui-auth-brand" href={`${base}/`}>
			<span class="ui-auth-brand-mark">
				<img src={`${base}/hero.png`} width="54" height="54" alt="" />
			</span>
			<span>
				<strong>ختم جمعی قرآن</strong>
				<small>هر آیه، یک قدم روشن</small>
			</span>
		</a>

		<div class="ui-auth-story-copy">
			<span class="ui-auth-kicker"><IconAutoAwesome /> همراه یک مسیر روشن</span>
			<h2>سهم کوچک ما، برکت یک ختم جمعی</h2>
			<p>
				با حساب کاربری، ختم‌هایی که ساخته‌اید و بخش‌هایی که خوانده‌اید همیشه همراه شما می‌مانند.
			</p>
		</div>

		<ul class="ui-auth-benefits">
			<li><IconMenuBook /><span>دسترسی دوباره به سهم‌های انتخاب‌شده</span></li>
			<li><IconGroups /><span>مدیریت ساده‌تر ختم‌های جمعی</span></li>
			<li><IconCheck /><span>نگهداری سوابق در یک حساب امن</span></li>
		</ul>
	</aside>

	<div class="ui-auth-panel">
		<div class="ui-auth-panel-heading">
			<span class="ui-auth-heading-icon"><IconAutoAwesome /></span>
			<div>
				<span>{eyebrow}</span>
				<h2>{title}</h2>
				<p>{description}</p>
			</div>
		</div>

		{@render children()}
	</div>
</section>
