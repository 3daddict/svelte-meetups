<script>
    import Header from './UI/Header.svelte'
    import MeetupGrid from './Meetups/MeetupGrid.svelte'
    import EditMeetup from './Meetups/EditMeetup.svelte'
    import TextInput from './UI/TextInput.svelte'
    import Button from './UI/Button.svelte'
    
    let meetups = [
        {
            id: 'm1',
            title: 'Coding Bootcamp',
            subtitle: 'Learn to code in 2 hours',
            description: 'In this meetup we have a description of things to talk about.',
            imageUrl: 'https://images.pexels.com/photos/3568521/pexels-photo-3568521.jpeg',
            address: '27th Nerd Road, 92626 California',
            contactEmail: 'code@test.com',
            isFavorite: false
        },
        {
            id: 'm2',
            title: 'Party Hard',
            subtitle: 'Pool party at my house',
            description: 'Come swim and have drinks by the pool',
            imageUrl: 'https://images.pexels.com/photos/3241804/pexels-photo-3241804.jpeg',
            address: '27th Nerd Road, 92626 California',
            contactEmail: 'pool@test.com',
            isFavorite: false
        },
    ]

    let editMode;
    
    function addMeetup(event) {
        const newMeetup = {
            id: Math.random.toString(),
            title: event.detail.title,
            subtitle: event.detail.subtitle,
            description: event.detail.description,
            imageUrl: event.detail.imageUrl,
            contactEmail: event.detail.email,
            address: event.detail.address
        }

        meetups = [newMeetup, ...meetups];
        editMode = null;
    }

    function togglefavorite(event) {
        const id = event.detail;
        // return a single meetup object where the id meets our extracted id
        // wrap in a spread operator to not mutate the original values. The spread operator to extract all the key/value pairs of this meetup and add them to a new object.
        const updatedMeetup = { ...meetups.find(m => m.id === id) };
        // create a toggle opposite of the original isFavorite value
        updatedMeetup.isFavorite = !updatedMeetup.isFavorite;
        // copy the entire array and replace the element that is updated in the array
        const meetupIndex = meetups.findIndex(m => m.id === id);
        const updatedMeetups = [...meetups];
        updatedMeetups[meetupIndex] = updatedMeetup;
        // override the exsting meetups array
        meetups = updatedMeetups;
    }

    function cancelEdit() {
        editMode = null;
    }

</script>

<style>
    main {
        margin-top: 5rem;
    }

    .meetup-controls {
        margin: 1rem;
    }
</style>

<Header />

<main>
<div class="meetup-controls">
    <Button on:click="{() => editMode = 'add'}">New Meetup</Button>
</div>
{#if editMode === 'add'}
    <EditMeetup on:save={addMeetup} on:cancel={cancelEdit} />
{/if}
    <MeetupGrid 
        meetups={meetups} 
        on:togglefavorite="{togglefavorite}" 
    />
</main>
