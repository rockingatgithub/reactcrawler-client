import React, { Component } from "react";
import {
  Button,
  Col,
  Container,
  Row,
  Form,
  ListGroup,
  Spinner,
} from "react-bootstrap";
import ms from "pretty-ms";
import didYouMean, { ReturnTypeEnums } from "didyoumean2";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tagInput: "",
      apiResponse: "",
      postsList: [],
      statusArray: [],
      showAll: true,
      onePost: {},
      userTags: new Array(1),
      suggestedUserTags: new Array(1),
      searchBox: [],
      showList: false,
    };
  }

  getPage = async () => {
    for (let i = 0; i < this.state.statusArray.length; i++) {
      let tempArray = [...this.state.statusArray];
      tempArray[i].status = "crawling....";
      this.setState({
        statusArray: tempArray,
      });
      let time = new Date().getTime();
      await fetch(`http://localhost:9000/getPage?url=${tempArray[i].url}`)
        .then((res) => res.json())
        .then((res) => {
          if (res.pageResponse !== undefined) {
            let post = {
              pageResponse: res.pageResponse,
              currentAuthor: res.pageResponse.author,
              tags: res.pageResponse.tags,
              responses: res.pageResponse.responses,
            };
            tempArray[i].status = "completed";
            tempArray[i].details = post;
            time = new Date().getTime() - time;
            tempArray[i].responseTime = ms(time);
            this.setState({
              statusArray: tempArray,
            });
          }
        });
    }
  };

  inputHandler = (e) => {
    const { userTags, suggestedUserTags } = this.state;

    let matchList = [...userTags, ...suggestedUserTags];

    let suggestionarr = didYouMean(e.target.value, matchList, {
      returnType: ReturnTypeEnums.ALL_MATCHES,
    });

    if (suggestionarr !== undefined) {
      this.setState({
        searchBox: suggestionarr,
        showList: true,
      });
    }

    // console.log("Array is" + suggestionarr[0]);
    this.setState({
      tagInput: e.target.value,
    });
  };

  searchHandler = async () => {
    this.setState({
      showList: false,
    });
    await fetch(`http://localhost:9000/getPage/tag/${this.state.tagInput}`)
      .then((res) => res.json())
      .then((res) =>
        this.setState({
          postsList: res.pageResponse.hrefListArray,
        })
      );
    let statusArray = new Array(this.state.postsList.length);
    for (let i = 0; i < statusArray.length; i++) {
      statusArray[i] = {
        status: "pending....",
        url: this.state.postsList[i],
        details: {},
        responseTime: "",
      };
    }
    this.setState({
      statusArray: statusArray,
      showAll: true,
      onePost: {},
    });

    await this.getPage();
  };

  openOne = (status) => {
    this.setState({
      showAll: false,
      onePost: status,
    });
  };

  inputTagHandler = async (tag) => {
    this.setState({
      tagInput: tag,
      showList: false,
    });
    console.log("tag is" + tag);
    await this.searchHandler();
  };

  loadMoreHandler = async () => {
    await fetch(`http://localhost:9000/getPage/loadMore/${this.state.tagInput}`)
      .then((res) => res.json())
      .then((res) =>
        this.setState({
          postsList: res.pageResponse.hrefListArray,
        })
      );
    let statusArray = new Array(this.state.postsList.length);
    for (let i = 0; i < statusArray.length; i++) {
      statusArray[i] = {
        status: "pending....",
        url: this.state.postsList[i],
        details: {},
        responseTime: "",
      };
    }
    this.setState({
      statusArray: statusArray,
      showAll: true,
      onePost: {},
    });

    await this.getPage();
  };

  getUserTags = async () => {
    await fetch(`http://localhost:9000/users/getTags`)
      .then((res) => res.json())
      .then((res) => {
        this.setState({
          userTags: res.tags,
          suggestedUserTags: res.suggestedTags,
        });
      });
  };

  componentDidMount = () => {
    this.getUserTags();
  };

  render() {
    const { onePost } = this.state;
    return (
      <Container fluid>
        <Row>
          <Col lg={10}>
            <Row>
              <Col lg={10}>
                <Form>
                  <Form.Group controlId="tagInput">
                    {/* <Form.Label>Tag</Form.Label> */}
                    <Form.Control
                      type="text"
                      placeholder="Enter a tag"
                      onChange={this.inputHandler}
                    />
                  </Form.Group>
                  <ListGroup>
                    {this.state.showList &&
                      this.state.searchBox.map((key) => (
                        <ListGroup.Item
                          onClick={() => this.inputTagHandler(key)}
                        >
                          {key}
                        </ListGroup.Item>
                      ))}
                  </ListGroup>
                </Form>
              </Col>
              <Col lg={2}>
                <Button
                  variant="primary"
                  type="button"
                  onClick={this.searchHandler}
                >
                  Submit
                </Button>
              </Col>
            </Row>
            <Row>
              <Col>
                {this.state.showAll ? (
                  <ListGroup>
                    {this.state.statusArray.map((status, ind) =>
                      status.status !== "completed" ? (
                        <ListGroup.Item>
                          <small>{ind + 1} </small>
                          <p>
                            {status.status}{" "}
                            {status.status === "pending...." ? (
                              <Spinner
                                animation="border"
                                variant="primary"
                                size="sm"
                              />
                            ) : (
                              <Spinner
                                animation="border"
                                variant="success"
                                size="sm"
                              />
                            )}
                          </p>
                        </ListGroup.Item>
                      ) : (
                        <ListGroup.Item onClick={() => this.openOne(status)}>
                          <p>{status.responseTime}</p>
                          <p>{status.details.pageResponse.heading}</p>
                          <br />
                          <p>{status.details.currentAuthor}</p>
                          <br />
                          <p>{status.details.pageResponse.blogContent}</p>
                          <br />
                          <p>
                            {status.details.tags.map((tag) =>
                              tag.substr(tag.lastIndexOf("/") + 1)
                            )}
                          </p>
                          <br />
                          <p>
                            {status.details.responses.map(
                              (response) => response
                            )}
                          </p>
                        </ListGroup.Item>
                      )
                    )}
                  </ListGroup>
                ) : (
                  <ListGroup>
                    {
                      <div>
                        <p>{onePost.responseTime}</p>
                        <p>{onePost.details.pageResponse.heading}</p>
                        <br />
                        <p>{onePost.details.currentAuthor}</p>
                        <br />
                        <p>{onePost.details.pageResponse.blogContent}</p>
                        <br />
                        <div>
                          {onePost.details.tags.map((tag) => (
                            <p onClick={() => this.inputTagHandler(tag)}>
                              {" "}
                              {tag.substr(tag.lastIndexOf("/") + 1)}{" "}
                            </p>
                          ))}
                        </div>
                        <br />
                        <p>
                          {onePost.details.responses.map(
                            (response) => response
                          )}
                        </p>
                        <Button onClick={this.loadMoreHandler}>
                          Load More
                        </Button>
                      </div>
                    }
                  </ListGroup>
                )}
              </Col>
            </Row>
          </Col>
          <Col lg={2}>
            <ListGroup>
              <h5>Search History</h5>
              {this.state.userTags.map((tag) => (
                <ListGroup.Item onClick={() => this.inputTagHandler(tag)}>
                  {tag}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Col>
        </Row>
        <Row>
          <Col lg={10}></Col>
        </Row>
      </Container>
    );
  }
}

export default App;
