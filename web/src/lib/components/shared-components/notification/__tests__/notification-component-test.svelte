<script lang="ts">
  interface Props {
    href: string;
  }

  let { href }: Props = $props();
</script>

Notification <b>message</b> with <a {href}>link</a>
