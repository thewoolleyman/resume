<script lang="ts">
  import ResumeApp from "$lib/components/ResumeApp.svelte";

  import type { PageData } from "./$types";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
</script>

<ResumeApp data={data.resume} />
