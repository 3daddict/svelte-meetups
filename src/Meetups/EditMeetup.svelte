<script>
    import { createEventDispatcher } from 'svelte';
    import TextInput from '../UI/TextInput.svelte';
    import Button from '../UI/Button.svelte';
    import Modal from '../UI/Modal.svelte';

    let title = '';
    let subtitle = '';
    let address = '';
    let email = '';
    let description = '';
    let imageUrl = '';

    const dispatch = createEventDispatcher();

    function submitForm() {
        dispatch('save', {
            title,
            subtitle,
            address,
            email,
            description,
            imageUrl
        });
    }

    function cancel() {
        dispatch('cancel')
    }
</script>

<style>
    form {
        width: 100%;
    }
</style>

<Modal title="Edit Meetup Data" on:cancel>
    <form on:submit|preventDefault="{submitForm}">
        <TextInput
            id="title"
            label="Title"
            value={title}
            on:input={event => (title = event.target.value)}
        />
        <TextInput
            id="subtitle"
            label="Subtitle"
            value={subtitle}
            on:input={event => (subtitle = event.target.value)} 
        />
        <TextInput
            id="address"
            label="Address"
            value={address}
            on:input={event => (address = event.target.value)}
        />
        <TextInput
            id="imageUrl"
            label="Image Url"
            value={imageUrl}
            on:input={event => (imageUrl = event.target.value)}
        />
        <TextInput
            id="email"
            type="email"
            label="Email"
            value={email}
            on:input={event => (email = event.target.value)}
        />
        <TextInput
            id="description"
            controlType="textarea"
            label="Description"
            value={description}
            on:input={event => (description = event.target.value)}
        />
    </form>
    <div slot="footer">
        <Button mode="outline" type="button" on:click={cancel}>Cancel</Button>
        <Button type="button" on:click={submitForm}>Save</Button>
    </div>
</Modal>