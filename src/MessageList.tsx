import React, { useState, FC, ReactElement } from 'react';
import './App.css';
import { Spin } from 'antd';
import Parse from 'parse';
import { useParseQuery } from  '@parse/react';

// Declare which props are expected when instantiating this component
type MessageListProps = {
  currentUser: Parse.User,
  currentChannel: Parse.Object,
  closeChannelCallback: () => void
}

export const MessageList: FC<MessageListProps> = (props: MessageListProps): ReactElement => {
  // State variable to hold input values and flags
  const [messageInput, setMessageInput] = useState("");

  // Create parse query for live querying using useParseQuery hook
  // Note that Parse.Object coming from props need to be changed into pointers
  // to be able to be used by Parse, since React changes the object structure
  // when passing down parameters to child components
  const parseQuery: Parse.Query = new Parse.Query("Message");
  // Get messages that involve both nicknames
  parseQuery.equalTo("channel",props.currentChannel.toPointer());
  // Set results ordering
  parseQuery.ascending("createdAt");
  // Include nickname fields, to enable name getting on list
  parseQuery.includeAll();

  // Declare hook and variables to hold hook responses
  const { isLoading, results } =
    useParseQuery(parseQuery, {
      enableLocalDatastore: false, // Enables cache in local datastore (default: true)
      enableLiveQuery: true, // Enables live query for real-time update (default: true)
    });

  // Message sender function
  const sendMessage = async () => {
    try {
      const messageText: string = messageInput;

      // Create new Message object, set parameters and save it
      const Message: Parse.Object = new Parse.Object("Message");
      Message.set("text", messageText);
      Message.set("channel", props.currentChannel.toPointer());
      Message.set("user", props.currentUser.toPointer());
      await Message.save();
      // Clear input
      setMessageInput("");
    } catch (error: any) {
      alert(error);
    }
  };

  return (
    <>
      {/* Channel header */}
      <h1 className="messages__heading">{`#${props.currentChannel.get('name')}`}</h1>
      {isLoading && <Spin />}
      {/* Messages */}
      {results && (
        <ul className="messages-list">
          {results.length > 0 ? results
            .sort((a, b) => a.get("createdAt") - b.get("createdAt"))
            .map((result: Parse.Object) => (
              <li
                className="message-box"
                key={result.id}
              >
                <p className="message__author">{`${result.get("user") && result.get("user").getUsername()}`}</p>
                <p className="message__text">{`${result.get("text")}`}</p>
              </li>
            )) : (
              <li>{"No messages here yet!"}</li>
            )}
        </ul>
      )}
      {/* Actions */}
      <div className="messages-compose">
        <div className="new-message">
          <textarea
            className="new-message__input"
            placeholder={"Your message..."}
            onChange={(event: any) => setMessageInput(event.target.value)}>{messageInput}
          </textarea>
          <button className="new-message__button" onClick={sendMessage}>{"Send"}</button>
        </div>
      </div>
    </>
  );
};