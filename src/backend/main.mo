import Outcall "./http-outcalls/outcall";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Array "mo:core/Array";

actor {
  type UserInfo = {
    email : Text;
    passwordHash : Text;
    role : Text;
  };

  type Rank = {
    id : Nat;
    name : Text;
    priceINR : Nat;
  };

  type Member = {
    id : Nat;
    playerName : Text;
    discordUsername : Text;
    rankId : Nat;
    purchaseDate : Int;
    renewalDate : Int;
    monthsPaidInAdvance : Nat;
    notes : Text;
  };

  var users : [(Text, UserInfo)] = [];
  var ranks : [Rank] = [];
  var members : [Member] = [];
  var nextRankId : Nat = 1;
  var nextMemberId : Nat = 1;
  var discordWebhookUrl : Text = "";

  func hashPassword(password : Text) : Text { "h_" # password };

  func findUser(email : Text) : ?UserInfo {
    for ((e, u) in users.vals()) {
      if (e == email) return ?u;
    };
    null
  };

  func verifyAdmin(email : Text, password : Text) : Bool {
    switch (findUser(email)) {
      case (null) false;
      case (?u) u.passwordHash == hashPassword(password) and (u.role == "admin" or u.role == "superAdmin");
    }
  };

  func appendUser(entry : (Text, UserInfo)) {
    let n = users.size();
    users := Array.tabulate<(Text, UserInfo)>(n + 1, func(i : Nat) : (Text, UserInfo) {
      if (i < n) users[i] else entry
    });
  };

  func appendRank(r : Rank) {
    let n = ranks.size();
    ranks := Array.tabulate<Rank>(n + 1, func(i : Nat) : Rank {
      if (i < n) ranks[i] else r
    });
  };

  func appendMember(m : Member) {
    let n = members.size();
    members := Array.tabulate<Member>(n + 1, func(i : Nat) : Member {
      if (i < n) members[i] else m
    });
  };

  public func registerUser(email : Text, password : Text) : async { ok : Bool; message : Text; role : Text } {
    switch (findUser(email)) {
      case (?_) { { ok = false; message = "Email already registered"; role = "" } };
      case (null) {
        let role = if (users.size() == 0) "superAdmin" else "user";
        let newUser : UserInfo = { email; passwordHash = hashPassword(password); role };
        appendUser((email, newUser));
        { ok = true; message = "Registered successfully"; role }
      };
    }
  };

  public query func loginUser(email : Text, password : Text) : async { ok : Bool; role : Text; message : Text } {
    switch (findUser(email)) {
      case (null) { { ok = false; role = ""; message = "Invalid credentials" } };
      case (?u) {
        if (u.passwordHash == hashPassword(password)) {
          { ok = true; role = u.role; message = "Login successful" }
        } else {
          { ok = false; role = ""; message = "Invalid credentials" }
        }
      };
    }
  };

  public query func listUsers() : async [{ email : Text; role : Text }] {
    users.map(func((e, u) : (Text, UserInfo)) : { email : Text; role : Text } {
      { email = e; role = u.role }
    })
  };

  public func setUserRole(callerEmail : Text, callerPassword : Text, targetEmail : Text, newRole : Text) : async { ok : Bool; message : Text } {
    switch (findUser(callerEmail)) {
      case (null) { { ok = false; message = "Caller not found" } };
      case (?caller) {
        if (caller.passwordHash != hashPassword(callerPassword)) {
          return { ok = false; message = "Invalid credentials" };
        };
        if (caller.role != "superAdmin") {
          return { ok = false; message = "Only superAdmin can change roles" };
        };
        switch (findUser(targetEmail)) {
          case (null) { { ok = false; message = "Target user not found" } };
          case (?target) {
            let updated : UserInfo = { target with role = newRole };
            let n = users.size();
            users := Array.tabulate<(Text, UserInfo)>(n, func(i : Nat) : (Text, UserInfo) {
              let (e, u) = users[i];
              if (e == targetEmail) (e, updated) else (e, u)
            });
            { ok = true; message = "Role updated" }
          };
        }
      };
    }
  };

  public query func getRanks() : async [Rank] { ranks };

  public func addRank(callerEmail : Text, callerPassword : Text, name : Text, priceINR : Nat) : async { ok : Bool; rankId : Nat; message : Text } {
    if (not verifyAdmin(callerEmail, callerPassword)) return { ok = false; rankId = 0; message = "Unauthorized" };
    let r : Rank = { id = nextRankId; name; priceINR };
    appendRank(r);
    let id = nextRankId;
    nextRankId += 1;
    { ok = true; rankId = id; message = "Rank added" }
  };

  public func updateRank(callerEmail : Text, callerPassword : Text, id : Nat, name : Text, priceINR : Nat) : async { ok : Bool; message : Text } {
    if (not verifyAdmin(callerEmail, callerPassword)) return { ok = false; message = "Unauthorized" };
    ranks := ranks.map(func(r : Rank) : Rank {
      if (r.id == id) { { id = r.id; name; priceINR } } else r
    });
    { ok = true; message = "Rank updated" }
  };

  public func deleteRank(callerEmail : Text, callerPassword : Text, id : Nat) : async { ok : Bool; message : Text } {
    if (not verifyAdmin(callerEmail, callerPassword)) return { ok = false; message = "Unauthorized" };
    ranks := ranks.filter(func(r : Rank) : Bool { r.id != id });
    { ok = true; message = "Rank deleted" }
  };

  public query func getMembers() : async [Member] { members };

  public func addMember(
    callerEmail : Text, callerPassword : Text,
    playerName : Text, discordUsername : Text,
    rankId : Nat, purchaseDate : Int,
    monthsPaidInAdvance : Nat, notes : Text
  ) : async { ok : Bool; memberId : Nat; message : Text } {
    if (not verifyAdmin(callerEmail, callerPassword)) return { ok = false; memberId = 0; message = "Unauthorized" };
    let months = if (monthsPaidInAdvance == 0) 1 else monthsPaidInAdvance;
    let msPerMonth : Int = 30 * 24 * 60 * 60 * 1000;
    let renewalDate = purchaseDate + (months * msPerMonth);
    let m : Member = { id = nextMemberId; playerName; discordUsername; rankId; purchaseDate; renewalDate; monthsPaidInAdvance = months; notes };
    appendMember(m);
    let id = nextMemberId;
    nextMemberId += 1;
    { ok = true; memberId = id; message = "Member added" }
  };

  public func updateMember(
    callerEmail : Text, callerPassword : Text,
    id : Nat, playerName : Text, discordUsername : Text,
    rankId : Nat, purchaseDate : Int,
    monthsPaidInAdvance : Nat, notes : Text
  ) : async { ok : Bool; message : Text } {
    if (not verifyAdmin(callerEmail, callerPassword)) return { ok = false; message = "Unauthorized" };
    let months = if (monthsPaidInAdvance == 0) 1 else monthsPaidInAdvance;
    let msPerMonth : Int = 30 * 24 * 60 * 60 * 1000;
    let renewalDate = purchaseDate + (months * msPerMonth);
    members := members.map(func(m : Member) : Member {
      if (m.id == id) {
        { id = m.id; playerName; discordUsername; rankId; purchaseDate; renewalDate; monthsPaidInAdvance = months; notes }
      } else m
    });
    { ok = true; message = "Member updated" }
  };

  public func deleteMember(callerEmail : Text, callerPassword : Text, id : Nat) : async { ok : Bool; message : Text } {
    if (not verifyAdmin(callerEmail, callerPassword)) return { ok = false; message = "Unauthorized" };
    members := members.filter(func(m : Member) : Bool { m.id != id });
    { ok = true; message = "Member deleted" }
  };

  public query func getExpiringMembers(withinDays : Nat) : async [Member] {
    let now : Int = Time.now() / 1_000_000;
    let futureMs : Int = now + (withinDays * 24 * 60 * 60 * 1000);
    members.filter(func(m : Member) : Bool {
      m.renewalDate >= now and m.renewalDate <= futureMs
    })
  };

  public query func getDiscordWebhookUrl() : async Text { discordWebhookUrl };

  public func setDiscordWebhookUrl(callerEmail : Text, callerPassword : Text, url : Text) : async { ok : Bool; message : Text } {
    if (not verifyAdmin(callerEmail, callerPassword)) return { ok = false; message = "Unauthorized" };
    discordWebhookUrl := url;
    { ok = true; message = "Webhook URL saved" }
  };

  public func sendDiscordAlert(message : Text) : async { ok : Bool; message : Text } {
    if (discordWebhookUrl == "") return { ok = false; message = "No webhook URL configured" };
    let body = "{\"content\":\"" # message # "\"}";
    try {
      let _ = await Outcall.httpPostRequest(
        discordWebhookUrl,
        [{ name = "Content-Type"; value = "application/json" }],
        body,
        transform
      );
      { ok = true; message = "Alert sent" }
    } catch (_) {
      { ok = false; message = "Failed to send alert" }
    }
  };

  public query func transform(input : Outcall.TransformationInput) : async Outcall.TransformationOutput {
    { input.response with headers = [] }
  };
};
