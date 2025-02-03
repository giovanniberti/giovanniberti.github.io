---
title: "Plain strings are a code smell"
date: 2025-02-02
image: yarn.jpg
categories: [software-design]
---

When designing software[^1], using plain strings is a code smell, so much so that it can be almost seen as an antipattern.

There, I said it --- you shouldn't use one of the most basic data structures you can possibly imagine.
Now let me explain exactly what I mean by this: I think that by the end of this post you will at least understand my point of view, and maybe even agree with me.

First, let's clarify what a string is: a string is **a sequence of bytes along with an encoding**. In most programming languages, the encoding is set by the language designers and is implicit in the program (for example, the C standard library assumes that strings are ASCII-encoded with a NUL byte ending, Rust uses UTF-8, Java uses UTF-16, and so on). Even though the source code or the in-memory representation doesn't acknowledge it, the character encoding is a critical piece of information, and is fundamentally what separates a string from a binary blob.

The encoding alone however, doesn't make strings _that_ much more powerful. Even if restricted to their encoding-allowed characters, strings can have any content, and there lies their problem: strings are **too arbitrary to be useful**. They don't have invariants. They don't have context.

Consider a simple `User` class in Java:

```java
public class User {
  private final String username;
  private final String nickname;

  public User(String username, String nickname) {
    this.username = username;
    this.nickname = nickname;
  }

  // --snip--
}
```

(I know this could have been a record, but let's suppose object identity is meaningful for `User` and hidden behind that `--snip--` comment :wink:).
By looking at this class, I get exactly zero information about what `User` and its fields should represent (even more so in Java where both fields could be `null`).
I can't form any [meaningful model](https://pages.cs.wisc.edu/~remzi/Naur.pdf) about the program's behaviour. Can the username be the same as the nickname? Can they be 10, 100, 1000 characters long? Is there any disallowed character? Can they be empty? Can they contain emojis?
All of these are _very_ concrete questions that cannot be answered unless I look at all instances where these two fields are validated, used and modified, hoping that all these instances are consistent with each other.

Let me now modify the example _very_ slightly:

```java
public class User {
  private final Username username;
  private final Nickname nickname;

  public User(Username username, Nickname nickname) {
    this.username = username;
    this.nickname = nickname;
  }

  // --snip--
}
```

Just by using different types I can infer the following:
 * usernames and nicknames are separate domain concepts, which cannot be intermixed (this constraint is materialized by having different types)
 * usernames and nicknames are not directly comparable
 * `Username` and `Nickname` may have different constraints, and if they have any they are most probably declared inside their respective classes

I have a lot more information, even without looking at the implementation.
Extensions of this pattern belong to the category of _type-driven development_, where powerful type systems can be used to encode even more properties about data into types. However, this line of reasoning is not limited to static type systems: any sufficiently type-safe[^2] language will do, even Python would do the job just fine.[^3]

Returning to our example, if I implement `Nickname` as follows:

```java
public record Nickname(String rawNickname) {
  public Nickname {
    Objects.requireNonNull(rawNickname);

    if (nickname.length() > 10) {
      throw new IllegalArgumentException("Nicknames cannot have more than 10 characters");
    }
  }
}
```

You instantly gain confidence in the fact that
1. nicknames cannot be longer than 10 characters in the language encoding
2. nicknames _can_ be empty
3. nicknames cannot be null (at least, what's inside them)
4. there are no explicit limitations to the allowed characters
5. invalid `Nickname` instances **cannot be constructed**

Properties 1-4 are characteristics that make a nickname a nickname in our example system. The fact that this kind of validation is all in one place rather than scattered across a codebase is nice, but nothing to shout about. [The fifth property, however, is a game changer](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/).
Unconstructibility of invalid instances means that not only propreties 1-4 are valid here, it means that they are valid _everywhere_. I don't have to check the whole codebase, I know for a fact that if any part of the program has access to a `Nickname` instance then it will have these 4 properties upheld. In more OOP-esque terms, these properties are effectively class invariants that are guaranteed upon construction. (I think that stating the idea in these terms hides a fair bit of its power).

Validating plain strings at endpoints not only is error prone, it actively hides information about what the data is about.
From an even more practical point of view, IDE autocomplete is also 10 times more useful (and precise) with more type information, so at the very least you get that.

Plain strings would make sense only when you have human-readable text without any domain constraint and can be mixed with any other unconstrained text. Now tell me, when was the last time you had something like that? :smiley:


> Featured photo by [Amie Bell](https://unsplash.com/photos/XGqS569rdgk).

[^1]: so no prototypes, no no-code tools, but programs that have to stand the test of time (or at least make economic sense)
[^2]: This of course excludes Javascript.
[^3]: Python however, having a dynamic type system, would require much more care
