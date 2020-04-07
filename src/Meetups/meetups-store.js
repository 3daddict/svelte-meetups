import { writable } from "svelte/store";

const meetups = writable([
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
]);

const customMeetupStore = {
    subscribe: meetups.subscribe,
    addMeetup: (meetupData) => {
        const newMeetup = {
            ...meetupData,
            id: Math.random().toString(),
            isFavorite: false
        };
        meetups.update(items => {
            return [newMeetup, ...items]
        })
    },
    updateMeetup: (id, meetupData) => {
        meetups.update(items => {
            const meetupIndex = items.findIndex(i => i.id === id);
            const updatedMeetup = { ...items[meetupIndex], ...meetupData }
            const updatedMeetups = [...items];
            updatedMeetups[meetupIndex] = updatedMeetup;
            return updatedMeetups;
        })
    },
    removeMeetup: (id) => {
        meetups.update(items => {
            return items.filter(i => i.id !== id);
        });
    },
    toggleFavorite: (id) => {
        meetups.update(items => {
            // return a single meetup object where the id meets our extracted id
            // wrap in a spread operator to not mutate the original values. The spread operator to extract all the key/value pairs of this meetup and add them to a new object.
            const updatedMeetup = { ...items.find(m => m.id === id) };
            // create a toggle opposite of the original isFavorite value
            updatedMeetup.isFavorite = !updatedMeetup.isFavorite;
            // copy the entire array and replace the element that is updated in the array
            const meetupIndex = items.findIndex(m => m.id === id);
            const updatedMeetups = [...items];
            updatedMeetups[meetupIndex] = updatedMeetup;
            // override the exsting meetups array
            return updatedMeetups;
        })
    }
}

export default customMeetupStore;