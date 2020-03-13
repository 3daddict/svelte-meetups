<script>
    import Header from './UI/Header.svelte'
    import MeetupGrid from './Meetups/MeetupGrid.svelte'
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
            contactEmail: 'code@test.com'
        },
        {
            id: 'm2',
            title: 'Party Hard',
            subtitle: 'Pool party at my house',
            description: 'Come swim and have drinks by the pool',
            imageUrl: 'https://images.pexels.com/photos/3241804/pexels-photo-3241804.jpeg',
            address: '27th Nerd Road, 92626 California',
            contactEmail: 'pool@test.com'
        },
    ]

    let title = '';
    let subtitle = '';
    let address = '';
    let email = '';
    let description = '';
    let imageUrl = '';

    function addMeetup() {
        const newMeetup = {
            id: Math.random.toString(),
            title: title,
            subtitle: subtitle,
            description: description,
            imageUrl: imageUrl,
            contactEmail: email,
            address: address
        }

        meetups = [newMeetup, ...meetups];
    }

</script>

<style>
main {
    margin-top: 5rem;
}
form {
    width: 30rem;
    max-width: 90%;
    margin: auto;
}
</style>

<Header />

<main>
    <form on:submit|preventDefault="{addMeetup}">
        <TextInput
            id="title"
            type="text"
            label="Title"
            value={title}
            on:input={event => (title = event.target.value)}
        />
        <TextInput
            id="subtitle"
            type="text"
            label="Subtitle"
            value={subtitle}
            on:input={event => (subtitle = event.target.value)} 
        />
        <TextInput
            id="address"
            type="text"
            label="Address"
            value={address}
            on:input={event => (address = event.target.value)}
        />
        <TextInput
            id="imageUrl"
            type="text"
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
        <Button
            type="submit"
            caption="Save"
         />
    </form>
    <MeetupGrid meetups={meetups} />
</main>
