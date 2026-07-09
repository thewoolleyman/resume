<script lang="ts">
  import StaticResume from "$lib/components/StaticResume.svelte";

  import type { PageData } from "./$types";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
</script>

<StaticResume data={data.resume} />
