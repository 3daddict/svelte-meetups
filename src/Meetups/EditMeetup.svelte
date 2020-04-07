<script>
    import meetups from "./meetups-store";
    import { createEventDispatcher } from 'svelte';
    import TextInput from '../UI/TextInput.svelte';
    import Button from '../UI/Button.svelte';
    import Modal from '../UI/Modal.svelte';
    import { isEmpty, isValidEmail } from '../helpers/validation'

    export let id = null;

    let title = '';
    let subtitle = '';
    let address = '';
    let email = '';
    let description = '';
    let imageUrl = '';

    if (id) {
        const unsubscribe = meetups.subscribe(items => {
            // Find meetup item with id
            const selectedMeetup = items.find(i => i.id === id);
            // Assign variables to the found meetup data
            title = selectedMeetup.title;
            subtitle = selectedMeetup.subtitle;
            address = selectedMeetup.address;
            email = selectedMeetup.contactEmail;
            description = selectedMeetup.description;
            imageUrl = selectedMeetup.imageUrl;
        });
        // We dont want any live updates while the user is editing the data in the modal
        // To prevent this we unsubscribe right after fetching the data from the store
        unsubscribe();
    }

    const dispatch = createEventDispatcher();

    $: titleValid = !isEmpty(title);
    $: subtitleValid = !isEmpty(subtitle);
    $: addressValid = !isEmpty(address);
    $: descriptionValid = !isEmpty(description);
    $: imageUrlValid = !isEmpty(imageUrl);
    $: emailValid = !isValidEmail(email);
    $: formIsValid = titleValid && subtitleValid && addressValid && descriptionValid && imageUrlValid && emailValid;

    function submitForm() {
        const meetupData = {
            title: title,
            subtitle: subtitle,
            description: description,
            imageUrl: imageUrl,
            contactEmail: email,
            address: address
        }

        // Check if the meetup has an id
        if (id) {
            meetups.updateMeetup(id, meetupData);
        } else {
            meetups.addMeetup(meetupData);
        }
        dispatch('save');
    }

    function deleteMeetup() {
        meetups.removeMeetup(id);
        dispatch('save');
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
            valid={titleValid}
            validityMessage="Please enter a valid title."
            value={title}
            on:input={event => (title = event.target.value)}
        />
        <TextInput
            id="subtitle"
            label="Subtitle"
            valid={subtitle}
            validityMessage="Please enter a valid response."
            value={subtitle}
            on:input={event => (subtitle = event.target.value)} 
        />
        <TextInput
            id="address"
            label="Address"
            valid={address}
            validityMessage="Please enter a valid response."
            value={address}
            on:input={event => (address = event.target.value)}
        />
        <TextInput
            id="imageUrl"
            label="Image Url"
            valid={imageUrl}
            validityMessage="Please enter a valid response."
            value={imageUrl}
            on:input={event => (imageUrl = event.target.value)}
        />
        <TextInput
            id="email"
            type="email"
            valid={email}
            validityMessage="Please enter a valid response."
            label="Email"
            value={email}
            on:input={event => (email = event.target.value)}
        />
        <TextInput
            id="description"
            controlType="textarea"
            label="Description"
            valid={description}
            validityMessage="Please enter a valid response."
            bind:value={description}
        />
    </form>
    <div slot="footer">
        <Button mode="outline" type="button" on:click={cancel}>Cancel</Button>
        <Button type="button" on:click={submitForm} disabled={!formIsValid} >Save</Button>
        {#if id}
            <Button type="button" on:click={deleteMeetup} >Delete</Button>
        {/if}
    </div>
</Modal>